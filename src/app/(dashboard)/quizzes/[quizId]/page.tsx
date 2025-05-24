// src/app/(dashboard)/quizzes/[quizId]/page.tsx (Simplified)
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import QuizPlayer from '@/components/quizzes/QuizPlayer'; // Ensure this path is correct

interface QuizTakingPageProps {
  params: {
    quizId: string;
  };
}

// Function to fetch just the quiz title for the header/metadata
async function getQuizHeaderInfo(supabase: any, quizId: string): Promise<{ title: string; description: string | null } | null> {
  const { data: quizInfo, error: quizInfoError } = await supabase
    .from('quizzes')
    .select('title, description')
    .eq('id', quizId)
    .single();

  if (quizInfoError || !quizInfo) {
    console.warn(`Could not fetch header info for quiz ${quizId}:`, quizInfoError);
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
  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId); // For page header

  if (!quizHeaderInfo) { // Basic check if quiz exists for header info
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Quiz Not Found</h1>
        <p className="text-gray-600">The quiz you are looking for might not exist.</p>
        <Link href="/quizzes" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-primary-dark">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Quizzes
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
      <div className="flex-grow">
        <QuizPlayer quizId={quizId} userId={user.id} />
      </div>
    </div>
  );
}