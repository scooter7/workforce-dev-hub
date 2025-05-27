import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
// MediaPosition import is no longer needed here as per last build fix
// import { MediaPosition } from '@/types/quiz';

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
  // video_url will now store HTML embed code, so it's just a string
  video_url: z.string().nullable().optional().or(z.literal('')), 
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

  if (authError || !user) { /* ... auth check ... */ 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) { /* ... admin check ... */ 
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const paramsValidation = paramsSchema.safeParse(params);
  if (!paramsValidation.success) { /* ... param validation ... */ 
    return NextResponse.json({ error: 'Invalid Quiz ID in URL.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
  }
  const { quizId } = paramsValidation.data;

  let body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  
  const validation = questionPayloadSchema.safeParse(body);
  if (!validation.success) { /* ... body validation ... */ 
    return NextResponse.json({ error: 'Invalid question data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  let { 
    question_text, question_type, explanation, points, order_num, options,
    image_url, video_url, media_position 
  } = validation.data;

  image_url = image_url?.trim() === '' ? null : image_url;
  video_url = video_url?.trim() === '' ? null : video_url; // video_url is now embed code

  if (image_url && video_url) { // Still good to only allow one type of media
    video_url = null; 
    // Or: return NextResponse.json({ error: 'Provide either an image URL or video embed code, not both.' }, { status: 400 });
  }
  if (!image_url && !video_url) media_position = null;

  // ... (multiple choice options validation remains same) ...
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
        video_url: video_url || null, // Storing the embed code string directly
        media_position: media_position || (image_url || video_url ? 'above_text' : null),
      })
      .select('id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position')
      .single();

    if (questionInsertError) { /* ... error handling ... */ 
        console.error("Error inserting question:", questionInsertError);
        return NextResponse.json({ error: 'Failed to create question.', details: questionInsertError.message }, { status: 500 });
    }

    // ... (options insertion logic remains the same) ...
    let insertedOptions: any[] = [];
    if (question_type === 'multiple-choice' && options && newQuestion) { /* ... */ }
    
    const fullQuestionData = { ...newQuestion, options: insertedOptions };
    return NextResponse.json({ message: 'Question added successfully!', question: fullQuestionData }, { status: 201 });

  } catch (error: any) { /* ... error handling ... */ 
    console.error(`POST /api/admin/quizzes/${quizId}/questions - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}