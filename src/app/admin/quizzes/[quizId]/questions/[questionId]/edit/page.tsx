import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import EditQuestionForm from '@/components/admin/EditQuestionForm';
import type { QuizQuestion } from '@/types/quiz';

// Fetches the specific question and its options for editing
async function getQuestionData(questionId: string): Promise<QuizQuestion | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('quiz_questions')
    .select(
      `
      *,
      options:quiz_question_options(*)
    `
    )
    .eq('id', questionId)
    .single();

  if (error) {
    console.error('Error fetching question to edit:', error);
    return null;
  }
  return data;
}

interface EditQuestionPageProps {
  params: {
    quizId: string;
    questionId: string;
  };
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const questionData = await getQuestionData(params.questionId);

  if (!questionData) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <Link
        href={`/admin/quizzes/${params.quizId}/manage`}
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Manage Quiz
      </Link>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        {/*
          Corrected: The prop name is now 'question' to match what the
          EditQuestionForm component expects.
        */}
        <EditQuestionForm
          quizId={params.quizId}
          question={questionData}
        />
      </div>
    </div>
  );
}
