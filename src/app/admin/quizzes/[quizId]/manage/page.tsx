import { createSupabaseServerClient } from '@/lib/supabase/server';
//import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import QuestionManager from '@/components/admin/QuestionManager'; // We'll create this
import { QuizQuestion, QuestionOption } from '@/types/quiz'; // Corrected import

interface ManageQuizPageProps {
  params: {
    quizId: string;
  };
}

interface QuizDetailsForAdmin {
    id: string;
    title: string;
    description?: string | null;
    questions: Array<Omit<QuizQuestion, 'options'> & { options: Array<Omit<QuestionOption, 'question_id'>> }>;
}

async function getQuizForAdmin(supabase: any, quizId: string): Promise<QuizDetailsForAdmin | null> {
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, description')
        .eq('id', quizId)
        .single();

    if (quizError || !quiz) {
        console.error("Admin: Error fetching quiz details for ", quizId, quizError);
        return null;
    }

    const { data: questionsRaw, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, explanation, points, order_num')
        .eq('quiz_id', quizId)
        .order('order_num');

    if (questionsError) {
        console.error("Admin: Error fetching questions for quiz ", quizId, questionsError);
        // Return quiz metadata even if questions fail, QuestionManager can show "no questions"
        return { ...quiz, questions: [] };
    }

    const questions = [];
    if (questionsRaw) {
        for (const q of questionsRaw) {
            const { data: optionsRaw, error: optionsError } = await supabase
                .from('question_options')
                // For admin, we DO fetch is_correct
                .select('id, option_text, is_correct')
                .eq('question_id', q.id)
                .order('id'); // Or some other consistent order

            if (optionsError) {
                console.error("Admin: Error fetching options for question ", q.id, optionsError);
            }
            questions.push({ ...q, options: optionsRaw || [] });
        }
    }
    // @ts-ignore
    return { ...quiz, questions };
}


export async function generateMetadata({ params }: ManageQuizPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: quiz } = await supabase.from('quizzes').select('title').eq('id', params.quizId).single();
  return {
    title: quiz ? `Manage Quiz: ${quiz.title}` : 'Manage Quiz',
  };
}

export default async function ManageQuizQuestionsPage({ params }: ManageQuizPageProps) {
  const supabase = createSupabaseServerClient();
  // Admin check is handled by the AdminLayout

  const quizId = params.quizId;
  const quizDetails = await getQuizForAdmin(supabase, quizId);

  if (!quizDetails) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-red-600">Quiz Not Found</h1>
        <p>The quiz you are trying to manage (ID: {quizId}) does not exist.</p>
        <Link href="/admin/quizzes" className="text-blue-500 hover:underline mt-4 inline-block">
          &larr; Back to Quizzes List (Admin)
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/quizzes" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark mb-4 text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Public Quizzes List
      </Link>
      <h1 className="text-3xl font-bold text-neutral-text mb-2">
        Manage Questions for: <span className="text-brand-primary">{quizDetails.title}</span>
      </h1>
      <p className="text-gray-600 mb-6">{quizDetails.description || 'No description for this quiz.'}</p>

      <QuestionManager quizId={quizDetails.id} initialQuestions={quizDetails.questions} />
    </div>
  );
}