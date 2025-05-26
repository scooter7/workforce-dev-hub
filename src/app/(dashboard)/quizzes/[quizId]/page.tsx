import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import QuizPlayer from '@/components/quizzes/QuizPlayer'; // QuizPlayer now fetches its own data
// QuizData, QuizQuestion, QuestionOption types are now in @/types/quiz and used by QuizPlayer internally

interface QuizTakingPageProps {
  params: {
    quizId: string;
  };
}

// Function to fetch just the quiz title and description for the page header
async function getQuizHeaderInfo(supabase: any, quizId: string): Promise<{ title: string; description: string | null } | null> {
  const { data: quizInfo, error: quizInfoError } = await supabase
    .from('quizzes')
    .select('title, description')
    .eq('id', quizId)
    .single();

  if (quizInfoError || !quizInfo) {
    if (quizInfoError && quizInfoError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error(`Error fetching header info for quiz ${quizId}:`, quizInfoError);
    }
    return null;
  }
  return quizInfo;
}

export async function generateMetadata({ params }: QuizTakingPageProps) {
  const supabase = createSupabaseServerClient();
  const quizHeaderInfo = await getQuizHeaderInfo(supabase, params.quizId);
  return {
    title: quizHeaderInfo ? `Quiz: ${quizHeaderInfo.title}` : 'Take Quiz',
  };
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?message=Please log in to take a quiz.`);
  }

  const quizId = params.quizId;
  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId);

  if (!quizHeaderInfo) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Quiz Not Found</h1>
        <p className="text-gray-600">The quiz you are looking for (ID: {quizId}) might not exist or could not be loaded.</p>
        <Link href="/quizzes" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary-dark">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Quizzes List
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-full">
      <div className="mb-6">
        <Link href="/quizzes" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark mb-2 text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Quizzes List
        </Link>
        <h1 className="text-3xl font-bold text-neutral-text">{quizHeaderInfo.title}</h1>
        {quizHeaderInfo.description && (
          <p className="mt-1 text-md text-gray-600">{quizHeaderInfo.description}</p>
        )}
      </div>
      
      {/* Pass only quizId and userId to QuizPlayer */}
      <div className="flex-grow">
        <QuizPlayer
            quizId={quizId}
            userId={user.id}
            // attemptId={/* pass attempt.id if managing attempts here from a parent state */}
        />
      </div>
    </div>
  );
}