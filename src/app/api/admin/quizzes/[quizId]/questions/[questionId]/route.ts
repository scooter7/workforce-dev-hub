import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

const paramsSchema = z.object({
  quizId: z.string().uuid("Invalid Quiz ID format."),
  questionId: z.string().uuid("Invalid Question ID format."),
});

export async function DELETE(
  _req: NextRequest, // Request object might not be used, but part of signature
  { params }: { params: { quizId: string; questionId: string } }
) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const paramsValidation = paramsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return NextResponse.json({ 
      error: 'Invalid URL parameters.', 
      details: paramsValidation.error.flatten().fieldErrors 
    }, { status: 400 });
  }
  
  const { quizId, questionId } = paramsValidation.data;
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // First, ensure the question belongs to the specified quiz for an extra check, though questionId should be unique.
    // This step is optional if questionId is globally unique and you trust it.
    const { data: questionCheck, error: checkError } = await supabaseAdmin
      .from('quiz_questions')
      .select('id')
      .eq('id', questionId)
      .eq('quiz_id', quizId) // Ensures the question is part of the given quiz
      .single();

    if (checkError || !questionCheck) {
      let message = 'Question not found or does not belong to the specified quiz.';
      if (checkError && checkError.code === 'PGRST116') { // No rows found
        // This is expected if the question doesn't exist or doesn't match quizId
      } else if (checkError) {
        console.error("Error checking question existence:", checkError);
        message = 'Error verifying question.';
      }
      return NextResponse.json({ error: message }, { status: 404 });
    }
    
    // Delete the question. Options associated via FK with ON DELETE CASCADE should be deleted automatically.
    const { error: deleteError, count } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (deleteError) {
      console.error("Error deleting question:", deleteError);
      return NextResponse.json({ error: 'Failed to delete question from database.', details: deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      // This case might be redundant if the check above works, but good as a safeguard.
      return NextResponse.json({ error: 'Question not found for deletion (no rows affected).' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Question deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error(`DELETE /api/admin/quizzes/${quizId}/questions/${questionId} - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}