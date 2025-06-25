import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabaseAdminClient';

const quizCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  // Note: I'm removing topic_id, subtopic_id, and difficulty as they
  // were not in your CreateQuizForm.tsx component. If you need them,
  // you can add them back here and to the form.
  
  // 1. Add card_image_url to the validation schema
  card_image_url: z.string().url().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Assuming you might want more robust role-based access later,
  // but for now just checking for a logged-in user.

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = quizCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { title, description, card_image_url } = validation.data;

  const supabaseAdmin = createSupabaseAdminClient();
  try {
    const { data: newQuiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title,
        description: description || null,
        user_id: user.id, // Associate the quiz with the creator
        // 2. Add the card_image_url to the insert data
        card_image_url: card_image_url || null,
      })
      // 3. Select the new card_image_url to return it to the client
      .select('id, title, description, card_image_url')
      .single();

    if (error) {
      console.error('Error creating quiz:', error);
      return NextResponse.json({ error: 'Failed to create quiz', details: error.message }, { status: 500 });
    }

    return NextResponse.json(newQuiz, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error creating quiz:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}