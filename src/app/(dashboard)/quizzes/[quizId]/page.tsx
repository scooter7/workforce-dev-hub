import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import { notFound } from 'next/navigation';

interface QuizTakingPageProps {
  params: {
    quizId: string;
  };
}

async function getQuizHeaderInfo(supabase: any, quizId: string): Promise<{ title: string; description: string | null } | null> {
  const { data: quizInfo, error: quizInfoError } = await supabase
    .from('quizzes')
    .select('title, description')
    .eq('id', quizId) // Supabase client should handle UUID conversion if id is UUID type
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
  if (!params.quizId) { // Handle case where quizId might be missing from params
      return { title: 'Invalid Quiz URL' };
  }
  const quizId = params.quizId.trim(); // Trim whitespace
  
  // Basic check for obviously invalid static slugs caught by this dynamic route
  if (quizId === 'new' || quizId === 'bulk-upload') {
    return { title: 'Admin Action' }; // Or a more appropriate title for these paths if they resolve elsewhere
  }

  // UUID validation for actual quiz IDs
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(quizId)) {
    console.warn(`generateMetadata: quizId "${quizId}" is not a valid UUID format.`);
    return { title: 'Invalid Quiz ID Format' };
  }

  const supabase = createSupabaseServerClient();
  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId);
  return {
    title: quizHeaderInfo ? `Quiz: ${quizHeaderInfo.title}` : 'Quiz Not Found',
  };
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  if (!params.quizId) {
    console.error("QuizTakingPage: quizId missing from params.");
    notFound();
  }
  const quizId = params.quizId.trim(); // Trim whitespace

  const reservedSlugs = ['new', 'bulk-upload']; // Add any other static slugs at this level
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (reservedSlugs.includes(quizId) || !uuidRegex.test(quizId)) {
    console.log(`QuizTakingPage: quizId "${quizId}" (after trim) is a reserved slug or not a valid UUID. Calling notFound().`);
    notFound();
  }

  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) { // Added authError check
    return redirect(`/login?message=Please log in to take a quiz.&redirect=/quizzes/${quizId}`);
  }

  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId);

  if (!quizHeaderInfo) {
    console.log(`QuizTakingPage: No quizHeaderInfo found for quizId "${quizId}". Calling notFound().`);
    notFound(); 
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