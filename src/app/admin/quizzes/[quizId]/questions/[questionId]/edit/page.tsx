import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { QuizQuestion, MediaPosition } from '@/types/quiz'; // Removed QuestionOption, kept QuizQuestion & MediaPosition
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

  const { data: optionsData, error: optionsError } = await supabase
    .from('question_options')
    .select('id, question_id, option_text, is_correct')
    .eq('question_id', questionData.id)
    .order('id');

  if (optionsError) {
    console.error(`Error fetching options for question ${questionData.id}:`, optionsError);
  }

  return {
    id: questionData.id, // Ensure all fields of QuizQuestion are covered
    quiz_id: questionData.quiz_id as string,
    question_text: questionData.question_text,
    question_type: questionData.question_type as 'multiple-choice' | 'true-false',
    explanation: questionData.explanation,
    points: questionData.points,
    order_num: questionData.order_num,
    image_url: questionData.image_url,
    video_url: questionData.video_url,
    media_position: questionData.media_position as MediaPosition | null, // MediaPosition used here
    options: (optionsData || []).map(opt => ({ // This structure must match QuestionOption defined in types/quiz.ts
        id: opt.id,
        question_id: opt.question_id || questionData.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
    })),
  };
}

export async function generateMetadata({ params }: EditQuestionPageProps) {
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

  const questionData = await getQuestionForEditing(supabase, params.quizId, params.questionId);

  if (!questionData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Question Not Found</h1>
        <p className="text-gray-600">The question you are trying to edit could not be found.</p>
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
        questionData={questionData} // This is typed as QuizQuestion
      />
    </div>
  );
}