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
 * Empty strings for image_url/video_url are converted to null first.
 */
const NewQuizQuestionSchema = z.object({
  question_text: z.string().min(1, 'question_text is required'),

  question_type: z
    .enum(['multiple-choice', 'true-false'])
    .default('multiple-choice'),

  explanation: z.string().nullable().optional(),

  points: z.number().int().min(0).default(1),

  order_num: z.number().int().min(0).default(0),

  // Preprocess "" → null, then require string URL or null/undefined
  image_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url().nullable().optional()
  ),

  video_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url().nullable().optional()
  ),

  media_position: z
    .enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'])
    // Allow null to be passed if no media is present
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
  const supabase = await createSupabaseServerClient();

  // 1) Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Parse and validate the request body
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
    order_num,
    image_url,
    video_url,
    media_position,
    options,
  } = parsed.data;

  // 3) Insert the question row
  const { data: createdQuestion, error: questionError } = await supabase
    .from('quiz_questions')
    .insert([
      {
        quiz_id: params.quizId,
        question_text,
        question_type,
        explanation,
        points,
        order_num,
        image_url: image_url ?? null,
        video_url: video_url ?? null,
        media_position: media_position, // Use the validated value directly (which can be null)
      },
    ])
    .select('*')
    .single();

  if (questionError) {
    return NextResponse.json({ error: questionError.message }, { status: 500 });
  }

  // 4) Insert the options
  const optionsWithQuestionId = options.map((option) => ({
    ...option,
    question_id: createdQuestion.id,
  }));

  const { error: optionsError } = await supabase
    .from('quiz_question_options')
    .insert(optionsWithQuestionId);

  if (optionsError) {
    // If options fail, it's good practice to roll back the question insert.
    // However, for simplicity here we'll just log the error.
    // In a real-world app, you'd handle this with a transaction.
    return NextResponse.json({ error: optionsError.message }, { status: 500 });
  }

  // 5) Return the created question with its options
  const finalQuestion = {
    ...createdQuestion,
    options: optionsWithQuestionId,
  };

  return NextResponse.json(finalQuestion, { status: 201 });
}