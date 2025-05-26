import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
// We'll create this client component later to handle the quiz interaction
import QuizPlayer from '@/components/quizzes/QuizPlayer';

// Define types for quiz structure (mirroring your database schema)
export interface QuestionOption {
  id: string; // UUID from question_options table
  question_id: string;
  option_text: string;
  // is_correct will be handled server-side during submission, not sent to client initially
}

export interface QuizQuestion {
  id: string; // UUID from quiz_questions table
  quiz_id: string;
  question_text: string;
  question_type: 'multiple-choice' | 'true-false'; // Add more types as needed
  explanation?: string | null;
  points: number;
  order_num: number;
  options: QuestionOption[]; // For multiple-choice questions
}

export interface QuizData {
  id: string; // UUID from quizzes table
  title: string;
  description?: string | null;
  topic_id: string;
  questions: QuizQuestion[];
}

interface QuizTakingPageProps {
  params: {
    quizId: string;
  };
}

// Function to fetch quiz data along with its questions and options
async function getQuizWithDetails(supabase: any, quizId: string): Promise<QuizData | null> {
  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, title, description, topic_id')
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) {
    console.error(`Error fetching quiz ${quizId}:`, quizError);
    return null;
  }

  // Fetch questions for this quiz, ordered by 'order_num'
  const { data: questionsRaw, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, question_text, question_type, explanation, points, order_num')
    .eq('quiz_id', quizId)
    .order('order_num', { ascending: true });

  if (questionsError) {
    console.error(`Error fetching questions for quiz ${quizId}:`, questionsError);
    return null; // Or return quiz with empty questions
  }

  const questions: QuizQuestion[] = [];
  if (questionsRaw) {
    for (const q of questionsRaw) {
      let options: QuestionOption[] = [];
      if (q.question_type === 'multiple-choice') {
        const { data: opts, error: optsError } = await supabase
          .from('question_options')
          .select('id, question_id, option_text') // Only send necessary data to client
          .eq('question_id', q.id)
          .order('id'); // Consistent ordering, or add an order_num to options

        if (optsError) {
          console.error(`Error fetching options for question ${q.id}:`, optsError);
          // Decide how to handle: skip question, return quiz as incomplete, etc.
        } else {
          options = opts || [];
        }
      }
      questions.push({ ...q, options });
    }
  }

  return { ...quiz, questions };
}

export async function generateMetadata({ params }: QuizTakingPageProps) {
  const supabase = createSupabaseServerClient(); // Temporary client for metadata
  const quizId = params.quizId;
  // In a real app, you might fetch just the quiz title for metadata
  // For now, we'll keep it simpler or fetch full data if performance isn't an issue for few quizzes
  const { data: quiz } = await supabase.from('quizzes').select('title').eq('id', quizId).single();
  const pageTitle = quiz ? `Quiz: ${quiz.title}` : 'Quiz';

  return {
    title: pageTitle,
  };
}


export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?message=Please log in to take a quiz.`);
  }

  const quizId = params.quizId;
  const quizData = await getQuizWithDetails(supabase, quizId);

  if (!quizData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Quiz Not Found</h1>
        <p className="text-gray-600">The quiz you are looking for does not exist or could not be loaded.</p>
        <Link href="/quizzes" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary-dark">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Quizzes
        </Link>
      </div>
    );
  }

  if (quizData.questions.length === 0) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-text mb-2">Quiz: {quizData.title}</h1>
        <p className="text-gray-600 mb-4">This quiz currently has no questions. Please check back later.</p>
        <Link href="/quizzes" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary-dark">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Quizzes
        </Link>
      </div>
    );
  }

  // TODO: Potentially create/resume a quiz_attempt record here before rendering QuizPlayer
  // const { data: attempt, error: attemptError } = await supabase
  //   .from('quiz_attempts')
  //   .insert({ user_id: user.id, quiz_id: quizData.id, status: 'in_progress', total_questions: quizData.questions.length })
  //   .select()
  //   .single();
  // if (attemptError || !attempt) { /* handle error */ }
  // Then pass attempt.id to QuizPlayer

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-full">
      <div className="mb-6">
        <Link href="/quizzes" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark mb-2 text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Quizzes List
        </Link>
        <h1 className="text-3xl font-bold text-neutral-text">{quizData.title}</h1>
        {quizData.description && (
          <p className="mt-1 text-md text-gray-600">{quizData.description}</p>
        )}
      </div>

      {/* QuizPlayer will be a client component to handle the interactive quiz experience */}
      <div className="flex-grow">
        <QuizPlayer
            quizData={quizData}
            userId={user.id}
            // attemptId={attempt.id} // Pass if managing attempts
        />
      </div>
    </div>
  );
}