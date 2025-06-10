// src/app/api/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient }    from '@/lib/supabase/server';
import type { QuizQuestion, QuestionOption } from '@/types/quiz';

/**
 * GET handler (unchanged)
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
    id:            q.id,
    quiz_id:       q.quiz_id,
    question_text: q.question_text,
    question_type: q.question_type,
    explanation:   q.explanation,
    points:        q.points,
    order_num:     q.order_num,
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
 * POST handler (temporarily only logs & echoes).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  // 1) Parse JSON
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    console.error('⚠️ JSON parse error:', err);
    return NextResponse.json({ error: 'Bad JSON', details: String(err) }, { status: 400 });
  }

  // 2) Log on server:
  console.log('🛠️ RAW BODY RECEIVED for quizId=' + params.quizId, body);

  // 3) Echo back to browser so you can inspect it:
  return NextResponse.json(
    { quizId: params.quizId, received: body },
    { status: 200 }
  );
}
