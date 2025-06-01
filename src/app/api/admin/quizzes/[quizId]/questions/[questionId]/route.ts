import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { QuizQuestion, MediaPosition } from '@/types/quiz';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Zod schema for validating URL parameters (used by both DELETE and PATCH)
const paramsSchema = z.object({
  quizId: z.string().uuid("Invalid Quiz ID format in URL."),
  questionId: z.string().uuid("Invalid Question ID format in URL."),
});

// --- PATCH (Update) Functionality ---
const optionUpdateSchema = z.object({
  id: z.string().uuid().optional(), 
  option_text: z.string().min(1, "Option text cannot be empty"),
  is_correct: z.boolean(),
});

const questionUpdatePayloadSchema = z.object({
  question_text: z.string().min(1, "Question text is required").optional(),
  question_type: z.enum(['multiple-choice', 'true-false'] as const).optional(),
  explanation: z.string().nullable().optional(),
  points: z.number().int().min(0, "Points cannot be negative").optional(),
  order_num: z.number().int().min(1, "Order number must be at least 1").optional(),
  image_url: z.string().url("Invalid image URL format.").nullable().optional().or(z.literal('')),
  video_url: z.string().nullable().optional().or(z.literal('')), 
  media_position: z.enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'] as const).nullable().optional(),
  options: z.array(optionUpdateSchema).min(2, "At least two options required.").optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { quizId: string; questionId: string } }
) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });

  const paramsValidation = paramsSchema.safeParse(params);
  if (!paramsValidation.success) return NextResponse.json({ error: 'Invalid URL parameters.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
  const { quizId, questionId } = paramsValidation.data;

  let body;
  try { body = await req.json(); } 
  catch (e) { return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 }); }
  
  const validation = questionUpdatePayloadSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: 'Invalid question update data.', details: validation.error.flatten().fieldErrors }, { status: 400 });

  const updateData = validation.data;
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const questionFieldsToUpdate: Partial<Omit<QuizQuestion, 'id' | 'quiz_id' | 'options'>> = {};
    if (updateData.question_text !== undefined) questionFieldsToUpdate.question_text = updateData.question_text;
    if (updateData.question_type !== undefined) questionFieldsToUpdate.question_type = updateData.question_type;
    if (updateData.explanation !== undefined) questionFieldsToUpdate.explanation = updateData.explanation;
    if (updateData.points !== undefined) questionFieldsToUpdate.points = updateData.points;
    if (updateData.order_num !== undefined) questionFieldsToUpdate.order_num = updateData.order_num;
    if (updateData.image_url !== undefined) questionFieldsToUpdate.image_url = updateData.image_url?.trim() || null;
    if (updateData.video_url !== undefined) questionFieldsToUpdate.video_url = updateData.video_url?.trim() || null;
    
    if (questionFieldsToUpdate.image_url && questionFieldsToUpdate.video_url) {
        questionFieldsToUpdate.video_url = null; 
    }
    if (updateData.media_position !== undefined) {
        questionFieldsToUpdate.media_position = (questionFieldsToUpdate.image_url || questionFieldsToUpdate.video_url) ? updateData.media_position : null;
    }

    if (Object.keys(questionFieldsToUpdate).length > 0) {
      const { error: questionUpdateError } = await supabaseAdmin
        .from('quiz_questions').update(questionFieldsToUpdate).eq('id', questionId).eq('quiz_id', quizId);
      if (questionUpdateError) throw new Error(`Failed to update question details: ${questionUpdateError.message}`);
    }

    if (updateData.options && (updateData.question_type || questionFieldsToUpdate.question_type)) { // Process options if provided
      const { error: deleteOptionsError } = await supabaseAdmin.from('question_options').delete().eq('question_id', questionId);
      if (deleteOptionsError) throw new Error(`Failed to update options (delete step): ${deleteOptionsError.message}`);

      if (updateData.options.length > 0) {
        const newOptionsToInsert = updateData.options.map(opt => ({
          question_id: questionId, option_text: opt.option_text, is_correct: opt.is_correct,
        }));
        const { error: insertOptionsError } = await supabaseAdmin.from('question_options').insert(newOptionsToInsert);
        if (insertOptionsError) throw new Error(`Failed to update options (insert step): ${insertOptionsError.message}`);
      }
    }

    const { data: updatedQuestionData, error: fetchUpdatedError } = await supabaseAdmin
      .from('quiz_questions')
      .select(`id, quiz_id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position, options:question_options (id, question_id, option_text, is_correct)`)
      .eq('id', questionId).single();
    if (fetchUpdatedError || !updatedQuestionData) throw new Error('Question updated, but failed to fetch the updated data.');
    
    const finalUpdatedQuestion: QuizQuestion = {
        ...updatedQuestionData,
        quiz_id: updatedQuestionData.quiz_id as string,
        question_type: updatedQuestionData.question_type as 'multiple-choice' | 'true-false',
        media_position: updatedQuestionData.media_position as MediaPosition | null,
        options: (updatedQuestionData.options || []).map((opt: any) => ({
            id: opt.id, question_id: opt.question_id || questionId, 
            option_text: opt.option_text, is_correct: opt.is_correct,
        })),
    };
    return NextResponse.json({ message: 'Question updated successfully!', question: finalUpdatedQuestion }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/admin/quizzes/${quizId}/questions/${questionId} - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred while updating question.', details: error.message }, { status: 500 });
  }
}

// --- DELETE Functionality (Your existing code) ---
export async function DELETE(
  _req: NextRequest,
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
    const { data: questionCheck, error: checkError } = await supabaseAdmin
      .from('quiz_questions').select('id').eq('id', questionId).eq('quiz_id', quizId).single();

    if (checkError || !questionCheck) {
      let message = 'Question not found or does not belong to the specified quiz.';
      if (checkError && checkError.code === 'PGRST116') { /* Expected if no rows */ } 
      else if (checkError) { console.error("Error checking question:", checkError); message = 'Error verifying question.'; }
      return NextResponse.json({ error: message }, { status: 404 });
    }
    
    const { error: deleteError, count } = await supabaseAdmin
      .from('quiz_questions').delete().eq('id', questionId);

    if (deleteError) {
      console.error("Error deleting question:", deleteError);
      return NextResponse.json({ error: 'Failed to delete question from database.', details: deleteError.message }, { status: 500 });
    }
    if (count === 0) return NextResponse.json({ error: 'Question not found for deletion.' }, { status: 404 });

    return NextResponse.json({ message: 'Question deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/admin/quizzes/${quizId}/questions/${questionId} - Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}