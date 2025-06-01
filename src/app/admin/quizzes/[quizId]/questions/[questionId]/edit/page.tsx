import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz'; // QuestionOption is used now
import EditQuestionForm from '@/components/admin/EditQuestionForm';

interface EditQuestionPageParams {
  quizId: string;
  questionId: string;
}

interface EditQuestionPageProps {
  params: EditQuestionPageParams;
}

async function getQuestionForEditing(
  supabase: any, 
  quizId: string, 
  questionId: string
): Promise<QuizQuestion | null> {
  const { data: questionData, error: questionError } = await supabase
    .from('quiz_questions')
    .select(`
      id,
      quiz_id,
      question_text,
      question_type,
      explanation,
      points,
      order_num,
      image_url,
      video_url,
      media_position
    `)
    .eq('id', questionId)
    .eq('quiz_id', quizId)
    .single();

  if (questionError || !questionData) {
    console.error(`Error fetching question ${questionId} for quiz ${quizId} for editing:`, questionError);
    return null;
  }

  // Fetch options for this question
  // Ensure the select string matches the QuestionOption type structure as much as possible
  const { data: optionsData, error: optionsError } = await supabase
    .from('question_options')
    .select('id, question_id, option_text, is_correct')
    .eq('question_id', questionData.id)
    .order('id'); 

  if (optionsError) {
    console.error(`Error fetching options for question ${questionData.id}:`, optionsError);
    // Consider how to handle this - e.g., return question with empty options or throw error
  }

  // Explicitly type 'opt' in the map function
  const mappedOptions: QuestionOption[] = (optionsData || []).map((opt: QuestionOption) => ({
      id: opt.id,
      question_id: opt.question_id || questionData.id, // Fallback if question_id might be missing from select (though it's selected)
      option_text: opt.option_text,
      is_correct: opt.is_correct,
  }));

  return {
    id: questionData.id,
    quiz_id: questionData.quiz_id as string,
    question_text: questionData.question_text,
    question_type: questionData.question_type as 'multiple-choice' | 'true-false',
    explanation: questionData.explanation,
    points: questionData.points,
    order_num: questionData.order_num,
    image_url: questionData.image_url,
    video_url: questionData.video_url,
    media_position: questionData.media_position as MediaPosition | null,
    options: mappedOptions,
  };
}

export async function generateMetadata({ params }: EditQuestionPageProps) {
  // Add validation or fetch actual question title if needed
  return {
    title: `Edit Quiz Question`,
  };
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to access admin features.');
  }
  // Further admin role check should happen in AdminLayout or here if necessary

  const questionData = await getQuestionForEditing(supabase, params.quizId, params.questionId);

  if (!questionData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Question Not Found</h1>
        <p className="text-gray-600">The question you are trying to edit could not be found or you do not have permission.</p>
        <Link href={`/admin/quizzes/${params.quizId}/manage`} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary-dark">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Manage Questions
        </Link>
      </div>
    );
  }

  const { data: quizInfo } = await supabase
    .from('quizzes')
    .select('title')
    .eq('id', params.quizId)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/quizzes/${params.quizId}/manage`} className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Manage Questions for "{quizInfo?.title || 'Quiz'}"
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-neutral-text mb-2">
        Edit Question
      </h1>
      <p className="mb-6 text-gray-600">
        Modify the details for this quiz question.
      </p>
      <EditQuestionForm 
        quizId={params.quizId} 
        questionData={questionData} 
      />
    </div>
  );
}