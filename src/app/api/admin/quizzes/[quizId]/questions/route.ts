import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
// MediaPosition import was removed as it's not directly used for typing here.

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
  video_url: z.string().nullable().optional().or(z.literal('')), // Accepts iframe string
  media_position: z.enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'] as const).nullable().optional(),
  options: z.array(optionSchema).min(2, "At least two options required for multiple-choice or true-false.").optional(), // Options are now expected for T/F too
});

const paramsSchema = z.object({
    quizId: z.string().uuid("Invalid Quiz ID format in URL"),
});

export async function POST(
  req: NextRequest, // req is used for req.json()
  { params }: { params: { quizId: string } }
) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const paramsValidation = paramsSchema.safeParse(params);
  if (!paramsValidation.success) return NextResponse.json({ error: 'Invalid Quiz ID', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
  const { quizId } = paramsValidation.data;

  let body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  
  const validation = questionPayloadSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: 'Invalid question data', details: validation.error.flatten().fieldErrors }, { status: 400 });

  let { 
    question_text, question_type, explanation, points, order_num, options,
    image_url, video_url, media_position 
  } = validation.data;

  image_url = image_url?.trim() === '' ? null : image_url;
  video_url = video_url?.trim() === '' ? null : video_url;
  if (image_url && video_url) video_url = null; 
  if (!image_url && !video_url) media_position = null;

  // Based on client-side form logic, 'options' should always be provided now for both types.
  if (!options || options.length < 2) {
    return NextResponse.json({ error: 'Questions require at least two options (e.g., True/False or multiple choices).' }, { status: 400 });
  }
  if (!options.some(opt => opt.is_correct)) {
    return NextResponse.json({ error: 'At least one option must be marked as correct.' }, { status: 400 });
  }
  if (question_type === 'multiple-choice' && options.filter(opt => opt.is_correct).length > 1) {
    // For simplicity, we'll only allow one correct answer for now, though DB supports multiple.
    // The form UI also enforces single selection for 'is_correct' radio buttons.
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
        media_position: media_position || (image_url || video_url ? 'above_text' : null),
      })
      .select('id, quiz_id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position') // Select all fields
      .single();

    if (questionInsertError || !newQuestion) { // Added !newQuestion check
      console.error("Error inserting question:", questionInsertError);
      return NextResponse.json({ error: 'Failed to create question.', details: questionInsertError?.message }, { status: 500 });
    }

    let insertedOptionsData: any[] = [];
    if (options && options.length > 0) { // Check options length here
      const optionsToInsert = options.map(opt => ({
        question_id: newQuestion.id, 
        option_text: opt.option_text, 
        is_correct: opt.is_correct,
      }));

      const { data: createdOptions, error: optionsInsertError } = await supabaseAdmin
        .from('question_options')
        .insert(optionsToInsert)
        .select('id, question_id, option_text, is_correct'); // Select what QuizPlayer expects
      
      if (optionsInsertError) {
        console.error("Error inserting options, question was created but options failed:", optionsInsertError);
        // Potentially delete the question here if options are critical, or return partial success
        return NextResponse.json({ 
          message: 'Question created, but failed to save options.', 
          question: newQuestion, 
          options: [] 
        }, { status: 207 }); // Multi-Status
      }
      insertedOptionsData = createdOptions || [];
    }
    
    // Construct the full question data as expected by QuizQuestion type for onQuestionAdded
    const fullQuestionData: QuizQuestion = {
        id: newQuestion.id,
        quiz_id: newQuestion.quiz_id,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type as 'multiple-choice' | 'true-false',
        explanation: newQuestion.explanation,
        points: newQuestion.points,
        order_num: newQuestion.order_num,
        image_url: newQuestion.image_url,
        video_url: newQuestion.video_url,
        media_position: newQuestion.media_position as MediaPosition | null,
        options: insertedOptionsData.map(opt => ({ // Ensure options match QuestionOption type
            id: opt.id,
            question_id: opt.question_id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
        })),
    };

    return NextResponse.json({ message: 'Question added successfully!', question: fullQuestionData }, { status: 201 });

  } catch (error: any) {
    console.error(`POST /api/admin/quizzes/${quizId}/questions - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}