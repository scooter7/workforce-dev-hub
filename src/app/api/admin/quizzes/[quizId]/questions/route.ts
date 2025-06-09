// src/app/api/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { QuizQuestion, QuestionOption } from '@/types/quiz';

/**
 * GET handler: fetch all questions (with their options) for a given quiz.
 * The incoming request object is prefixed with `_` since we don't actually read it.
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

  const result: QuizQuestion[] = (data ?? []).map((q) => ({
    id: q.id,
    quiz_id: q.quiz_id,
    question_text: q.question_text,
    question_type: q.question_type,
    explanation: q.explanation,
    points: q.points,
    order_num: q.order_num,
    options: (q.question_options ?? []).map((opt: QuestionOption) => ({
      id: opt.id,
      question_id: opt.question_id,
      option_text: opt.option_text,
      is_correct: opt.is_correct,
    })),
    image_url: q.image_url,
    video_url: q.video_url,
    media_position: q.media_position,
  }));

  return NextResponse.json(result);
}

/**
 * Zod schema for validating the body of POST requests.
 */
const NewQuizQuestionSchema = z.object({
  question: z.string(),
  options: z
    .array(
      z.object({
        option_text: z.string(),
        is_correct: z.boolean(),
      })
    )
    .min(1),
  media_url: z.string().url().optional(),
});

/**
 * POST handler: create a new question (and its options) for a given quiz.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { quizId } = params;

  // 1) Validate body
  const parsed = NewQuizQuestionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { question, options, media_url } = parsed.data;

  // 2) Insert into quiz_questions
  const { data: createdQuestion, error: questionError } = await supabase
    .from('quiz_questions')
    .insert([
      {
        quiz_id: quizId,
        question_text: question,
        question_type: 'multiple-choice',
        explanation: null,
        points: 1,
        order_num: 0,
        image_url: media_url ?? null,
        video_url: null,
        media_position: null,
      },
    ])
    .select('*')
    .single();

  if (questionError || !createdQuestion) {
    return NextResponse.json(
      { error: questionError?.message ?? 'Failed to create question' },
      { status: 500 }
    );
  }

  // 3) Insert question_options
  const optionsToInsert = options.map((opt) => ({
    question_id: createdQuestion.id,
    option_text: opt.option_text,
    is_correct: opt.is_correct,
  }));

  const { data: createdOptions, error: optionsError } = await supabase
    .from('question_options')
    .insert(optionsToInsert)
    .select('*');

  if (optionsError || !createdOptions) {
    return NextResponse.json(
      { error: optionsError?.message ?? 'Failed to create question options' },
      { status: 500 }
    );
  }

  // 4) Build full QuizQuestion to return
  const result: QuizQuestion = {
    id: createdQuestion.id,
    quiz_id: createdQuestion.quiz_id,
    question_text: createdQuestion.question_text,
    question_type: createdQuestion.question_type,
    explanation: createdQuestion.explanation,
    points: createdQuestion.points,
    order_num: createdQuestion.order_num,
    options: createdOptions.map((opt: QuestionOption) => ({
      id: opt.id,
      question_id: opt.question_id,
      option_text: opt.option_text,
      is_correct: opt.is_correct,
    })),
    image_url: createdQuestion.image_url,
    video_url: createdQuestion.video_url,
    media_position: createdQuestion.media_position,
  };

  return NextResponse.json(result, { status: 201 });
}
