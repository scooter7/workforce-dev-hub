import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema to validate the incoming quizId from the URL
const paramsSchema = z.object({
  quizId: z.string().uuid("Invalid Quiz ID format."),
});

/**
 * Handles GET requests to fetch a single quiz by its ID.
 * This is useful for admin purposes, like fetching data for an edit form.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();

  // Validate the quizId from the URL
  const paramsValidation = paramsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return NextResponse.json({ 
      error: 'Invalid URL parameter.', 
      details: paramsValidation.error.flatten().fieldErrors 
    }, { status: 400 });
  }
  
  const { quizId } = paramsValidation.data;

  // Optional: Add admin authentication check if needed
  // const { data: { user } } = await supabase.auth.getUser();
  // if (user?.id !== process.env.ADMIN_USER_ID) {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // }

  try {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*') // Select all columns for the quiz
      .eq('id', quizId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Code for "No rows found"
        return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
      }
      // For other database errors
      console.error('Database error fetching quiz:', error);
      return NextResponse.json({ error: 'Failed to fetch quiz details.', details: error.message }, { status: 500 });
    }

    return NextResponse.json(quiz, { status: 200 });

  } catch (error: any) {
    console.error(`GET /api/admin/quizzes/${quizId} Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}

// You can also add PATCH (update) and DELETE handlers for a specific quiz in this same file.