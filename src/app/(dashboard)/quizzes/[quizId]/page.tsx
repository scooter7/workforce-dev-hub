// src/app/(dashboard)/quizzes/[quizId]/page.tsx
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
  if (!params.quizId) return { title: 'Invalid Quiz URL' };
  const quizId = params.quizId.trim();
  const reservedSlugs = ['new', 'bulk-upload'];
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (reservedSlugs.includes(quizId) || !uuidRegex.test(quizId)) {
    return { title: 'Invalid Action or Quiz ID' };
  }
  const supabase = createSupabaseServerClient();
  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId);
  return {
    title: quizHeaderInfo ? `Quiz: ${quizHeaderInfo.title}` : 'Quiz Not Found',
  };
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  if (!params.quizId) { notFound(); }
  const quizId = params.quizId.trim();

  const reservedSlugs = ['new', 'bulk-upload'];
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (reservedSlugs.includes(quizId) || !uuidRegex.test(quizId)) {
    // console.log(`QuizTakingPage: quizId "${quizId}" is reserved or not UUID. Calling notFound().`);
    notFound();
  }

  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect(`/login?message=Please log in to take a quiz.&redirect=/quizzes/${quizId}`);
  }

  const quizHeaderInfo = await getQuizHeaderInfo(supabase, quizId);

  if (!quizHeaderInfo) {
    // console.log(`QuizTakingPage: No quizHeaderInfo for quizId "${quizId}". Calling notFound().`);
    notFound(); 
  }

  return (
    // This root div should be a flex column and allow its children to manage height
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8"> {/* Takes full height from parent in DashboardLayout */}
      <div className="mb-6 flex-shrink-0"> {/* Header part does not grow */}
        <Link href="/quizzes" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark mb-2 text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Quizzes List
        </Link>
        <h1 className="text-3xl font-bold text-neutral-text">{quizHeaderInfo.title}</h1>
        {quizHeaderInfo.description && (
          <p className="mt-1 text-md text-gray-600">{quizHeaderInfo.description}</p>
        )}
      </div>
      
      {/* This wrapper for QuizPlayer needs to grow and provide a flex context */}
      <div className="flex-grow flex flex-col min-h-0"> {/* Allows QuizPlayer to use h-full effectively */}
        <QuizPlayer
            quizId={quizId}
            userId={user.id}
        />
      </div>
    </div>
  );
}