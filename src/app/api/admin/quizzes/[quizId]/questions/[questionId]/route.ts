import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Updated Zod schema for PATCH payload
// This is now more flexible and matches the creation schema.
const UpdateQuizQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required.').optional(),
  explanation: z.string().nullable().optional(),
  points: z.coerce.number().int().min(0).optional(),
  // Corrected: Removed strict .url() validation to allow any string.
  video_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  media_position: z
    .enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'])
    .optional(),
  // We'll also allow updating options
  options: z.array(z.object({
      id: z.string().uuid().optional(), // Existing options will have an ID
      option_text: z.string().min(1),
      is_correct: z.boolean(),
  })).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { quizId: string; questionId: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = UpdateQuizQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid question update data', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { options, ...questionData } = parsed.data;

  // Update the question details if any were provided
  if (Object.keys(questionData).length > 0) {
      const { error: questionUpdateError } = await supabase
        .from('quiz_questions')
        .update(questionData)
        .eq('id', params.questionId);

      if (questionUpdateError) {
        console.error('Error updating question:', questionUpdateError);
        return NextResponse.json({ error: 'Failed to update question', details: questionUpdateError.message }, { status: 500 });
      }
  }

  // Update options if they were provided
  if (options) {
      for (const option of options) {
          const { id, ...optionData } = option;
          if (id) {
              // Update existing option
              await supabase.from('quiz_question_options').update(optionData).eq('id', id);
          } else {
              // Insert new option
              await supabase.from('quiz_question_options').insert({ ...optionData, question_id: params.questionId });
          }
      }
  }

  return NextResponse.json({ message: 'Question updated successfully' });
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { quizId: string; questionId: string } }
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', params.questionId);

    if (error) {
        return NextResponse.json({ error: 'Failed to delete question', details: error.message }, { status: 500 });
    }

    return new Response(null, { status: 204 }); // 204 No Content
}
