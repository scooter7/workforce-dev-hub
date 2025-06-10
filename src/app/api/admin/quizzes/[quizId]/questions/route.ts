// src/app/api/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET handler: returns all questions + their options for a quiz
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select(
      `
      *,
      options:quiz_question_options(*)
    `
    )
    .eq('quiz_id', params.quizId)
    .order('order_num', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(questions);
}

/**
 * Zod schema for POST payload.
 */
const NewQuizQuestionSchema = z.object({
  question_text: z.string().min(1, 'question_text is required'),
  question_type: z
    .enum(['multiple-choice', 'true-false'])
    .default('multiple-choice'),
  explanation: z.string().nullable().optional(),
  points: z.number().int().min(0).default(1),
  order_num: z.number().int().min(0).optional(),
  image_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  video_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  media_position: z
    .enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'])
    .nullable()
    .optional(),
  options: z
    .array(
      z.object({
        option_text: z.string().min(1, 'option_text is required'),
        is_correct: z.boolean(),
      })
    )
    .min(1, 'At least one option is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  // Wrap the entire function in a try...catch block for robust error handling
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = NewQuizQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      question_text,
      question_type,
      explanation,
      points,
      image_url,
      video_url,
      media_position,
      options,
    } = parsed.data;

    const { data: existingQuestions, error: countError } = await supabase
      .from('quiz_questions')
      .select('order_num')
      .eq('quiz_id', params.quizId)
      .order('order_num', { ascending: false })
      .limit(1);

    if (countError) {
      return NextResponse.json({ error: "Failed to determine question order", details: countError.message }, { status: 500 });
    }

    const nextOrderNum = existingQuestions.length > 0 ? existingQuestions[0].order_num + 1 : 0;

    const { data: createdQuestion, error: questionError } = await supabase
      .from('quiz_questions')
      .insert([
        {
          quiz_id: params.quizId,
          question_text,
          question_type,
          explanation,
          points,
          order_num: nextOrderNum,
          image_url: image_url ?? null,
          video_url: video_url ?? null,
          media_position: media_position,
        },
      ])
      .select('*')
      .single();

    // Add explicit checks for both an error and for null data
    if (questionError || !createdQuestion) {
      console.error("Error inserting question:", questionError);
      return NextResponse.json({ error: "Database error: Could not create the question.", details: questionError?.message || "Insert failed to return data." }, { status: 500 });
    }

    const optionsWithQuestionId = options.map((option) => ({
      ...option,
      question_id: createdQuestion.id,
    }));

    const { error: optionsError } = await supabase
      .from('quiz_question_options')
      .insert(optionsWithQuestionId);

    if (optionsError) {
      console.error("Error inserting options:", optionsError);
      // Ideally, you would delete the orphaned question here in a real-world app
      return NextResponse.json({ error: "Question was created, but failed to add answer options.", details: optionsError.message }, { status: 500 });
    }

    const finalQuestion = {
      ...createdQuestion,
      options: optionsWithQuestionId,
    };

    return NextResponse.json(finalQuestion, { status: 201 });

  } catch (e: any) {
    // This will catch any other unexpected errors in the process
    console.error("An unexpected error occurred in POST /questions:", e);
    return NextResponse.json({ error: "An unexpected internal server error occurred.", details: e.message }, { status: 500 });
  }
}
