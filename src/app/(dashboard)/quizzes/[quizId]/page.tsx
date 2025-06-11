import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import type { QuizQuestion } from '@/types/quiz';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// This interface defines the expected structure of a question with its options.
// Supabase joins will return data in this shape.
interface QuestionWithOptions extends Omit<QuizQuestion, 'options'> {
  options: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
  }>;
}

// This is an async function that fetches all necessary data for the quiz from the database.
async function getQuizData(quizId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch the main quiz details (like title) first.
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, title, description')
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) {
    console.error('Error fetching quiz:', quizError);
    return null; // Return null if the quiz itself isn't found.
  }

  // Then, fetch all questions related to that quiz, including their options, in one go.
  // The 'options:quiz_question_options(*)' part is a Supabase feature for joining related tables.
  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*, options:quiz_question_options(*)')
    .eq('quiz_id', quizId)
    .order('order_num', { ascending: true });

  if (questionsError) {
    console.error('Error fetching questions for quiz:', questionsError);
    // Return the quiz details even if questions fail, so the page can render a message.
    return { ...quiz, questions: [] };
  }

  // Combine the quiz details with the fetched questions.
  return { ...quiz, questions: questions as QuestionWithOptions[] };
}

interface QuizPageProps {
  params: {
    quizId: string;
  };
}

// This is the main server component for the quiz page.
export default async function QuizPage({ params }: QuizPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, redirect them to the login page.
    return redirect('/login');
  }

  const quizId = params.quizId;
  const quizData = await getQuizData(quizId);

  // If quizData is null, it means the quiz wasn't found. Show the Next.js notFound page.
  if (!quizData) {
    notFound();
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/quizzes"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Quizzes List
        </Link>
        {/*
          Here we pass the necessary props to the QuizPlayer client component.
          The 'userId' prop has been removed as it's not defined in QuizPlayerProps.
        */}
        <QuizPlayer
          quizId={quizData.id}
          title={quizData.title}
          questions={quizData.questions}
        />
      </div>
    </div>
  );
}
