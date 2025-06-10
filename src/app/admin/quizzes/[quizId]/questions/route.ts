// src/app/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz';

//
// 1) Define your Zod schema to mirror the exact column names in Supabase.
//
const NewQuizQuestionSchema = z.object({
  // Must send this exact key:
  question_text: z.string().min(1, "question_text is required"),

  // Your options table uses option_text + is_correct
  options: z
    .array(
      z.object({
        option_text: z.string().min(1),
        is_correct:  z.boolean(),
      })
    )
    .min(1, "At least one option is required"),

  // Optional media URL → goes into `image_url`
  image_url: z.string().url().optional(),

  // If you ever support video:
  video_url: z.string().url().optional(),

  // Must match your CHECK constraint:
  media_position: z
    .enum(['above_text','below_text','left_of_text','right_of_text'])
    .optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { quizId } = params;

  // 2) Validate incoming body
  const body = await req.json();
  const parsed = NewQuizQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // 3) Destructure the validated data
  const { question_text, options, image_url, video_url, media_position } =
    parsed.data;

  // 4) Insert into your quiz_questions table
  const { data: createdQuestion, error: questionError } = await supabase
    .from('quiz_questions')
    .insert([
      {
        quiz_id:        quizId,
        question_text,                   // maps directly to column
        question_type: 'multiple-choice',// default in your schema
        explanation:    null,            // or accept from client if you like
        points:         1,               // or accept from client
        order_num:      0,               // you can compute next order_num here
        image_url:      image_url  ?? null,
        video_url:      video_url  ?? null,
        media_position: media_position ?? 'above_text',
      },
    ])
    .select('*')
    .single();

  if (questionError || !createdQuestion) {
    return NextResponse.json(
      { error: questionError?.message ?? 'Failed to insert question' },
      { status: 500 }
    );
  }

  // 5) Insert into question_options
  const optsToInsert = options.map((opt) => ({
    question_id: createdQuestion.id,
    option_text: opt.option_text,
    is_correct:  opt.is_correct,
  }));
  const { data: createdOptions, error: optionsError } = await supabase
    .from('question_options')
    .insert(optsToInsert)
    .select('*');

  if (optionsError || !createdOptions) {
    return NextResponse.json(
      { error: optionsError?.message ?? 'Failed to insert options' },
      { status: 500 }
    );
  }

  // 6) Build the full QuizQuestion to return
  const result: QuizQuestion = {
    id:             createdQuestion.id,
    quiz_id:        createdQuestion.quiz_id,
    question_text:  createdQuestion.question_text,
    question_type:  createdQuestion.question_type,
    explanation:    createdQuestion.explanation,
    points:         createdQuestion.points,
    order_num:      createdQuestion.order_num,
    options:        createdOptions.map((opt: QuestionOption) => ({
                      id:           opt.id,
                      question_id:  opt.question_id,
                      option_text:  opt.option_text,
                      is_correct:   opt.is_correct,
                    })),
    image_url:      createdQuestion.image_url,
    video_url:      createdQuestion.video_url,
    media_position: createdQuestion.media_position as MediaPosition,
  };

  // 7) Send it back
  return NextResponse.json(result, { status: 201 });
}
