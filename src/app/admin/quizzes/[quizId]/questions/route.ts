import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Keep the existing POST handler as is
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { quizId } = params;
  const { question, options, media_url } = (await req.json()) as Question;

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert([
      {
        quiz_id: quizId,
        question_text: question,
        media_url: media_url,
      },
    ])
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create question', details: error?.message },
      { status: 500 }
    );
  }

  const questionId = data.id;
  const optionsWithQuestionId = options.map((option) => ({
    ...option,
    question_id: questionId,
  }));

  const { error: optionsError } = await supabase
    .from('quiz_options')
    .insert(optionsWithQuestionId);

  if (optionsError) {
    return NextResponse.json(
      { error: 'Failed to create options', details: optionsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Question created successfully' },
    { status: 201 }
  );
}

// ✨ ADD THIS NEW GET HANDLER ✨
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const includeOptions = searchParams.get('includeOptions') === 'true';

  const paramsSchema = z.object({
    quizId: z.string().uuid("Invalid quiz ID."),
  });

  const validation = paramsSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid URL parameters' }, { status: 400 });
  }

  const { quizId } = validation.data;

  try {
    // Fetch questions for the given quizId
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        options:quiz_options (
          *
        )
      `)
      .eq('quiz_id', quizId);

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json(questions, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'An unexpected error occurred.', details: err.message }, { status: 500 });
  }
}