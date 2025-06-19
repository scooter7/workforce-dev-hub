// src/app/(dashboard)/quizzes/[quizId]/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// The unused 'workforceTopics' import has been removed.
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import { QuizWithQuestionsAndAnswers } from '@/types/quiz';
import Link from 'next/link';

export const revalidate = 0; // Ensure fresh data on every request

// Function to generate metadata for the page head
export async function generateMetadata({ params }: { params: { quizId: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('title')
    .eq('id', params.quizId)
    .single();

  if (error || !quiz) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `Quiz - ${quiz.title}`,
  };
}

export default async function QuizPage({ params }: { params: { quizId: string } }) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      topic_id,
      subtopic_id,
      questions (
        id,
        question_text,
        answers (
          id,
          answer_text,
          is_correct
        )
      )
    `)
    .eq('id', params.quizId)
    .single();

  if (quizError || !quizData) {
    console.error('Error fetching quiz:', quizError);
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Quiz Not Found</h1>
        <p className="text-gray-600 mt-2">
          Sorry, we couldn't find the quiz you're looking for.
        </p>
        <Link href="/quizzes" className="mt-4 text-brand-primary hover:underline">
          &larr; Back to Quizzes
        </Link>
      </div>
    );
  }

  // The type assertion here ensures TypeScript knows the shape of our data
  const typedQuizData = quizData as QuizWithQuestionsAndAnswers;

  return (
    <div className="h-full w-full">
      <QuizPlayer quiz={typedQuizData} />
    </div>
  );
}