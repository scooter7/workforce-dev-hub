// src/app/admin/quizzes/[quizId]/manage/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
// Corrected: Use a named import for QuestionManager
import { QuestionManager } from '@/components/admin/QuestionManager';

interface ManageQuizPageProps {
  params: {
    quizId: string;
  };
}

// This function is simplified to only fetch the main quiz details.
// The QuestionManager component will handle fetching its own questions and options.
async function getQuizDetails(supabase: any, quizId: string) {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('id, title, description')
    .eq('id', quizId)
    .single();

  if (error) {
    console.error(`Error fetching quiz details for ${quizId}:`, error);
    return null;
  }
  return quiz;
}

export async function generateMetadata({ params }: ManageQuizPageProps) {
  const supabase = createSupabaseServerClient();
  const quiz = await getQuizDetails(supabase, params.quizId);
  return {
    title: quiz ? `Manage Quiz: ${quiz.title}` : 'Manage Quiz',
  };
}

export default async function ManageQuizQuestionsPage({
  params,
}: ManageQuizPageProps) {
  const supabase = createSupabaseServerClient();
  const quizId = params.quizId;
  const quiz = await getQuizDetails(supabase, quizId);

  if (!quiz) {
    // The notFound() function is a cleaner way to handle this in Next.js
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      {/* Corrected Link to point back to the admin quizzes list */}
      <Link
        href="/admin/quizzes"
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Quizzes
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Manage Questions for: <span className="text-blue-600">{quiz.title}</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {quiz.description || 'No description for this quiz.'}
        </p>
      </div>

      {/* The QuestionManager now only needs the quizId.
        It will fetch its own list of questions internally.
        This resolves the error from passing an unexpected 'initialQuestions' prop.
      */}
      <QuestionManager quizId={quiz.id} />
    </div>
  );
}
