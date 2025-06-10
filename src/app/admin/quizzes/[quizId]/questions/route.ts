// src/app/admin/quizzes/[quizId]/questions/route.ts

import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  // 1) Try to parse the incoming JSON
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    console.error('⚠️ Failed to parse JSON:', err);
    return NextResponse.json(
      { error: 'Bad JSON payload', details: err },
      { status: 400 }
    );
  }

  // 2) Log it on the server (Vercel logs, or your local console)
  console.log('🛠️  RAW BODY RECEIVED:', body);

  // 3) Echo it back in the HTTP response so you can inspect
  return NextResponse.json(
    { received: body, quizId: params.quizId },
    { status: 200 }
  );
}
