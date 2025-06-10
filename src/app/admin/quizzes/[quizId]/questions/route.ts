// src/app/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz';

// 1) This is the schema we expect from the client
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
  media_url: z.string().url().optional(),              // becomes image_url
  media_position: z.enum([
    'above_text',
    'below_text',
    'left_of_text',
    'right_of_text',
  ]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { quizId } = params;

  // 2) Validate the incoming JSON
  const body = await req.json();
  const parsed = NewQuizQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { question, options, media_url, media_position } = parsed.data;

  // 3) Insert the quiz_questions row
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
        media_position: media_position ?? null,
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

  // 4) Insert all the options in question_options
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

  // 5) Shape the response to match your QuizQuestion interface
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
    media_position: createdQuestion.media_position as MediaPosition | null,
  };

  // 6) Return the newly created question + options
  return NextResponse.json(result, { status: 201 });
}
