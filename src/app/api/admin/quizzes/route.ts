import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Re-add all the fields to the validation schema
const quizCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  topic_id: z.string().min(1, "Topic ID is required"),
  subtopic_id: z.string().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard'] as const),
  card_image_url: z.string().url().nullable().optional(), // Keep our new image url
});

export async function POST(req: NextRequest) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // This admin check is good, let's keep it.
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const body = await req.json();
  const validation = quizCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid quiz data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // Insert all the data from the form, including the new card_image_url
    const { data: newQuiz, error: insertError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        ...validation.data,
        user_id: user.id // Also good to associate the quiz with the creator
      })
      .select('id, title, topic_id, description, difficulty, card_image_url') // Return the created quiz data
      .single();

    if (insertError) {
      console.error("Error creating quiz:", insertError);
      return NextResponse.json({ error: 'Failed to create quiz.', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quiz created successfully!', quiz: newQuiz }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/admin/quizzes - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}