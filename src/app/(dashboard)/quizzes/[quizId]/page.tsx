// src/app/(dashboard)/quizzes/[quizId]/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import { notFound } from 'next/navigation'; // <<< IMPORT notFound

interface QuizTakingPageProps {
  params: {
    quizId: string;
  };
}

async function getQuizHeaderInfo(supabase: any, quizId: string): Promise<{ title: string; description: string | null } | null> {
  // Validate quizId is a UUID before querying if it's not "new" or other reserved words
  // However, the DB will throw an error if it's not a UUID for the 'id' column.
  const { data: quizInfo, error: quizInfoError } = await supabase
    .from('quizzes')
    .select('title, description')
    .eq('id', quizId)
    .single();

  if (quizInfoError || !quizInfo) {
    if (quizInfoError && quizInfoError.code !== 'PGRST116') { 
        console.error(`Error fetching header info for quiz ${quizId}:`, quizInfoError);
    }
    return null;
  }
  return quizInfo;
}

export async function generateMetadata({ params }: QuizTakingPageProps) {
  // If "new" or "bulk-upload" somehow reaches here, prevent metadata generation
  if (params.quizId === 'new' || params.quizId === 'bulk-upload' || !params.quizId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
    return { title: 'Invalid Quiz' };
  }
  const supabase = createSupabaseServerClient();
  const quizHeaderInfo = await getQuizHeaderInfo(supabase, params.quizId);
  return {
    title: quizHeaderInfo ? `Quiz: ${quizHeaderInfo.title}` : 'Quiz Not Found',
  };
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const quizId = params.quizId;

  // Prevent this page from trying to process "new" or "bulk-upload" as a quizId
  if (quizId === 'new' || quizId === 'bulk-upload' || !quizId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
    console.log(`QuizTakingPage: quizId "${quizId}" is not a valid UUID. Rendering notFound.`);
    notFound(); // This will render the not-found page for this path
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?message=Please log in to take a quiz.&redirect=/quizzes/${quizId}`);
  }

  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId);

  if (!quizHeaderInfo) {
    notFound(); // Quiz ID was a UUID but not found in DB
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
        <QuizPlayer
            quizId={quizId}
            userId={user.id}
        />
      </div>
    </div>
  );
}