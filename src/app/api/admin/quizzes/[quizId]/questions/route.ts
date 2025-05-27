import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
// Removed: import { MediaPosition } from '@/types/quiz'; 

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

const optionSchema = z.object({
  option_text: z.string().min(1, "Option text cannot be empty"),
  is_correct: z.boolean(),
});

const questionPayloadSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  question_type: z.enum(['multiple-choice', 'true-false'] as const),
  explanation: z.string().nullable().optional(),
  points: z.number().int().min(0, "Points cannot be negative"),
  order_num: z.number().int().min(1, "Order number must be at least 1"),
  image_url: z.string().url("Invalid image URL format.").nullable().optional().or(z.literal('')),
  video_url: z.string().url("Invalid video URL format.").nullable().optional().or(z.literal('')),
  media_position: z.enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'] as const).nullable().optional(),
  options: z.array(optionSchema).optional(),
});

const paramsSchema = z.object({
    quizId: z.string().uuid("Invalid Quiz ID format in URL"),
});

export async function POST(
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

  const paramsValidation = paramsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return NextResponse.json({ error: 'Invalid Quiz ID in URL.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
  }
  const { quizId } = paramsValidation.data;

  let body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 }); }
  
  const validation = questionPayloadSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid question data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  let { 
    question_text, question_type, explanation, points, order_num, options,
    image_url, video_url, media_position 
  } = validation.data;

  image_url = image_url?.trim() === '' ? null : image_url;
  video_url = video_url?.trim() === '' ? null : video_url;
  if (image_url && video_url) video_url = null; 
  if (!image_url && !video_url) media_position = null;

  if (question_type === 'multiple-choice' && (!options || options.length < 2 || !options.some(opt => opt.is_correct))) {
    return NextResponse.json({ error: 'Multiple-choice questions require at least two options and one correct answer.' }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const { data: newQuestion, error: questionInsertError } = await supabaseAdmin
      .from('quiz_questions')
      .insert({
        quiz_id: quizId, question_text, question_type, 
        explanation: explanation || null, 
        points, order_num,
        image_url: image_url || null,
        video_url: video_url || null,
        media_position: media_position || (image_url || video_url ? 'above_text' : null), // Default if media exists but no position
      })
      .select('id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position')
      .single();

    if (questionInsertError) {
      console.error("Error inserting question:", questionInsertError);
      return NextResponse.json({ error: 'Failed to create question.', details: questionInsertError.message }, { status: 500 });
    }

    let insertedOptions: any[] = [];
    if (question_type === 'multiple-choice' && options && newQuestion) {
      const optionsToInsert = options.map(opt => ({
        question_id: newQuestion.id, option_text: opt.option_text, is_correct: opt.is_correct,
      }));
      if (optionsToInsert.length > 0) {
        const { data: createdOptions, error: optionsInsertError } = await supabaseAdmin
          .from('question_options')
          .insert(optionsToInsert)
          .select('id, option_text, is_correct');
        if (optionsInsertError) {
          console.error("Error inserting options:", optionsInsertError);
          return NextResponse.json({ question: newQuestion, options: [], warning: 'Question created, options failed.' }, { status: 207 });
        }
        insertedOptions = createdOptions || [];
      }
    }
    
    const fullQuestionData = { ...newQuestion, options: insertedOptions };
    return NextResponse.json({ message: 'Question added successfully!', question: fullQuestionData }, { status: 201 });

  } catch (error: any) {
    console.error(`POST /api/admin/quizzes/${quizId}/questions - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}