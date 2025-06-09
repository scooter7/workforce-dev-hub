import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Shared Zod Schemas
const paramsSchema = z.object({
  quizId: z.string().uuid("Invalid Quiz ID format in URL"),
});

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
  video_url: z.string().nullable().optional().or(z.literal('')),
  media_position: z.enum(['above_text', 'below_text', 'left_of_text', 'right_of_text'] as const).nullable().optional(),
  options: z.array(optionSchema).min(2, "At least two options required.").optional(),
});


/**
 * Handles POST requests to create a new question for a quiz.
 * Admin-only route.
 */
export async function POST(
  req: NextRequest,
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

  if ((question_type === 'multiple-choice' || question_type === 'true-false') && (!options || options.length < 2)) {
    return NextResponse.json({ error: 'Multiple-choice and True/False questions require at least two options.' }, { status: 400 });
  }
  if ((question_type === 'multiple-choice' || question_type === 'true-false') && options && !options.some(opt => opt.is_correct)) {
    return NextResponse.json({ error: 'At least one option must be marked as correct.' }, { status: 400 });
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
      .select('id, quiz_id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position')
      .single();

    if (questionInsertError || !newQuestion) {
      console.error("Error inserting question:", questionInsertError);
      return NextResponse.json({ error: 'Failed to create question.', details: questionInsertError?.message }, { status: 500 });
    }

    let insertedOptionsData: QuestionOption[] = [];
    if (options && options.length > 0 && newQuestion) {
      const optionsToInsert = options.map(opt => ({
        question_id: newQuestion.id, 
        option_text: opt.option_text, 
        is_correct: opt.is_correct,
      }));

      const { data: createdOptions, error: optionsInsertError } = await supabaseAdmin
        .from('quiz_options') // Corrected table name
        .insert(optionsToInsert)
        .select('id, question_id, option_text, is_correct');
      
      if (optionsInsertError) {
        console.error("Error inserting options:", optionsInsertError);
        return NextResponse.json({ 
          message: 'Question created, but failed to save options.', 
          question: newQuestion, 
          options: [] 
        }, { status: 207 });
      }
      insertedOptionsData = createdOptions || [];
    }
    
    const fullQuestionData: QuizQuestion = {
        id: newQuestion.id,
        quiz_id: newQuestion.quiz_id as string,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type as 'multiple-choice' | 'true-false',
        explanation: newQuestion.explanation,
        points: newQuestion.points,
        order_num: newQuestion.order_num,
        image_url: newQuestion.image_url,
        video_url: newQuestion.video_url,
        media_position: newQuestion.media_position as MediaPosition | null,
        options: insertedOptionsData,
    };

    return NextResponse.json({ message: 'Question added successfully!', question: fullQuestionData }, { status: 201 });

  } catch (error: any) {
    console.error(`POST /api/admin/quizzes/${params.quizId}/questions - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}

/**
 * Handles GET requests to fetch all questions for a specific quiz.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();
  
  const validation = paramsSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid URL parameters', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { quizId } = validation.data;

  try {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        options:quiz_options (
          *
        )
      `)
      .eq('quiz_id', quizId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json(questions, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'An unexpected error occurred.', details: err.message }, { status: 500 });
  }
}