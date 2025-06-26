import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Schema for updating a quiz
const quizUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  topic_id: z.string().min(1, "Topic ID is required").optional(),
  subtopic_id: z.string().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard'] as const).optional(),
  card_image_url: z.string().url("Invalid URL").nullable().optional(),
});


export async function PATCH(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const body = await req.json();
  const validation = quizUpdateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid quiz data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const { data: updatedQuiz, error: updateError } = await supabaseAdmin
      .from('quizzes')
      .update(validation.data)
      .eq('id', params.quizId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating quiz:", updateError);
      return NextResponse.json({ error: 'Failed to update quiz.', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Quiz updated successfully!', quiz: updatedQuiz }, { status: 200 });

  } catch (error: any) {
    console.error('PATCH /api/admin/quizzes/[quizId] - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}


export async function DELETE(
  _request: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
        return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }
     
    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', params.quizId);

    if (error) {
      console.error('API Delete Error:', error);
      return NextResponse.json({ error: 'Failed to delete quiz', details: error.message }, { status: 500 });
    }

    return new Response(null, { status: 204 });

  } catch (e: any) {
    return NextResponse.json({ error: 'An unexpected error occurred', details: e.message }, { status: 500 });
  }
}