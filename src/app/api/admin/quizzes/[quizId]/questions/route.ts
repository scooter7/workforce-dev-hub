import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
  options: z.array(optionSchema).optional(), // Options are for multiple-choice
});

const paramsSchema = z.object({
    quizId: z.string().uuid("Invalid Quiz ID format in URL"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } } // quizId comes from the folder name [quizId]
) {
  const supabaseAuth = createSupabaseServerClient(); // For admin user check via session
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
  const { quizId } = paramsValidation.data; // This is the validated quizId from the URL

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }
  
  const validation = questionPayloadSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid question data.', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { question_text, question_type, explanation, points, order_num, options } = validation.data;

  if (question_type === 'multiple-choice' && (!options || options.length < 2 || !options.some(opt => opt.is_correct))) {
    return NextResponse.json({ error: 'Multiple-choice questions require at least two options and one correct answer.' }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // Insert the question
    const { data: newQuestion, error: questionInsertError } = await supabaseAdmin
      .from('quiz_questions')
      .insert({
        quiz_id: quizId, // Use the validated quizId from the URL parameter
        question_text,
        question_type,
        explanation: explanation || null,
        points,
        order_num,
      })
      .select('id, question_text, question_type, explanation, points, order_num') // Select what you want to return
      .single();

    if (questionInsertError) {
      console.error("Error inserting question:", questionInsertError);
      return NextResponse.json({ error: 'Failed to create question.', details: questionInsertError.message }, { status: 500 });
    }

    let insertedOptions: any[] = [];
    if (question_type === 'multiple-choice' && options && newQuestion) {
      const optionsToInsert = options.map(opt => ({
        question_id: newQuestion.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
      }));

      if (optionsToInsert.length > 0) {
        const { data: createdOptions, error: optionsInsertError } = await supabaseAdmin
          .from('question_options')
          .insert(optionsToInsert)
          .select('id, option_text, is_correct'); // Select what you need

        if (optionsInsertError) {
          console.error("Error inserting options, rolling back question might be needed or handle partially:", optionsInsertError);
          // For simplicity, we'll return the question but note options failed.
          // Production: Use a transaction or handle cleanup (e.g., delete the question if options fail).
          return NextResponse.json({
            question: newQuestion,
            options: [],
            warning: 'Question created, but its options failed to save.'
          }, { status: 207 }); // Multi-Status indicates partial success
        }
        insertedOptions = createdOptions || [];
      }
    }
    
    const fullQuestionData = { ...newQuestion, options: insertedOptions };

    return NextResponse.json({ message: 'Question added successfully!', question: fullQuestionData }, { status: 201 });

  } catch (error: any) {
    console.error(`POST /api/admin/quizzes/${quizId}/questions - Generic Error:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred while adding the question.', details: error.message }, { status: 500 });
  }
}