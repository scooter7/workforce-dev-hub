import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'; // Corrected: createSupabaseAdminClient is also from server.ts
import { z } from 'zod';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

const quizCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  topic_id: z.string().min(1, "Topic ID is required"), // Ensure it's not an empty string if sent
  subtopic_id: z.string().nullable().optional(), // Can be empty string from form, convert to null
  difficulty: z.enum(['easy', 'medium', 'hard'] as const),
});

export async function POST(req: NextRequest) {
  const supabaseAuth = createSupabaseServerClient(); // For admin user check via session
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const body = await req.json();
  const validation = quizCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid quiz data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  // Ensure empty string for subtopic_id becomes null for the database
  let { title, description, topic_id, subtopic_id, difficulty } = validation.data;
  if (subtopic_id === '') {
    subtopic_id = null;
  }

  const supabaseAdmin = createSupabaseAdminClient(); // This is correctly imported now

  try {
    const { data: newQuiz, error: insertError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title,
        description: description || null,
        topic_id,
        subtopic_id: subtopic_id, // Will be null if empty string was passed and converted
        difficulty,
        // created_at and updated_at have defaults in the DB
      })
      .select('id, title, topic_id, description, difficulty') // Return the created quiz
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