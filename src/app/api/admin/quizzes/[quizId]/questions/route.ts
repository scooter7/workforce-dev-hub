// src/app/api/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient }    from '@/lib/supabase/server';
import { z }                             from 'zod';
import type { QuizQuestion, QuestionOption } from '@/types/quiz';

/**
 * GET /api/admin/quizzes/:quizId/questions
 * — Returns all questions + their options for this quiz.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { quizId } = params;

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*, question_options(*)')
    .eq('quiz_id', quizId)
    .order('order_num', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map exactly into your QuizQuestion interface
  const result: QuizQuestion[] = (data ?? []).map((q) => ({
    id:            q.id,
    quiz_id:       q.quiz_id,
    question_text: q.question_text,
    question_type: q.question_type,
    explanation:   q.explanation,
    points:        q.points,
    order_num:     q.order_num,                // ← ensures order_num is present
    options:       (q.question_options ?? []).map((opt: QuestionOption) => ({
                     id:           opt.id,
                     question_id:  opt.question_id,
                     option_text:  opt.option_text,
                     is_correct:   opt.is_correct,
                   })),
    image_url:     q.image_url,
    video_url:     q.video_url,
    media_position:q.media_position,
  }));

  return NextResponse.json(result);
}


/**
 * Zod schema for validating POST /api/admin/quizzes/:quizId/questions
 */
const NewQuizQuestionSchema = z.object({
  question_text: z.string().min(1, 'question_text is required'),
  options: z
    .array(
      z.object({
        option_text: z.string().min(1),
        is_correct:  z.boolean(),
      })
    )
    .min(1, 'At least one option is required'),
  image_url:      z.string().url().optional(),
  video_url:      z.string().url().optional(),
  media_position: z
    .enum(['above_text','below_text','left_of_text','right_of_text'])
    .optional(),
});

/**
 * POST /api/admin/quizzes/:quizId/questions
 * — Creates a new question + its options.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { quizId } = params;

  // 1) Validate incoming JSON
  const parsed = NewQuizQuestionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { question_text, options, image_url, video_url, media_position } =
    parsed.data;

  // 2) Insert question
  const { data: createdQuestion, error: questionError } = await supabase
    .from('quiz_questions')
    .insert([
      {
        quiz_id:        quizId,
        question_text,
        question_type:  'multiple-choice',
        explanation:    null,
        points:         1,
        order_num:      0,             // you can compute the next order_num here instead
        image_url:      image_url ?? null,
        video_url:      video_url ?? null,
        media_position: media_position ?? 'above_text',
      },
    ])
    .select('*')
    .single();

  if (!createdQuestion || questionError) {
    return NextResponse.json(
      { error: questionError?.message ?? 'Failed to create question' },
      { status: 500 }
    );
  }

  // 3) Insert options
  const optsToInsert = options.map((opt) => ({
    question_id: createdQuestion.id,
    option_text: opt.option_text,
    is_correct:  opt.is_correct,
  }));
  const { data: createdOptions, error: optionsError } = await supabase
    .from('question_options')
    .insert(optsToInsert)
    .select('*');

  if (!createdOptions || optionsError) {
    return NextResponse.json(
      { error: optionsError?.message ?? 'Failed to create options' },
      { status: 500 }
    );
  }

  // 4) Build and return the new QuizQuestion
  const result: QuizQuestion = {
    id:            createdQuestion.id,
    quiz_id:       createdQuestion.quiz_id,
    question_text: createdQuestion.question_text,
    question_type: createdQuestion.question_type,
    explanation:   createdQuestion.explanation,
    points:        createdQuestion.points,
    order_num:     createdQuestion.order_num,
    options:       createdOptions.map((opt: QuestionOption) => ({
                     id:           opt.id,
                     question_id:  opt.question_id,
                     option_text:  opt.option_text,
                     is_correct:   opt.is_correct,
                   })),
    image_url:     createdQuestion.image_url,
    video_url:     createdQuestion.video_url,
    media_position:createdQuestion.media_position,
  };

  return NextResponse.json(result, { status: 201 });
}
