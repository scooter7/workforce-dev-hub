// src/app/(dashboard)/quizzes/[quizId]/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import { QuizData, QuizQuestion } from '@/types/quiz'; // 'QuestionOption' has been removed
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const revalidate = 0;

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

  // 1. Fetch the main quiz data
  const { data: quizInfo, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', params.quizId)
    .single();

  if (quizError || !quizInfo) {
    console.error('Error fetching quiz:', quizError?.message);
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold">Quiz Not Found</h1>
        <p className="text-gray-600 mt-2">Sorry, we couldn't find the quiz you're looking for.</p>
        <Link href="/quizzes" className="mt-4 text-brand-primary hover:underline">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  // 2. Fetch all questions for this quiz
  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', params.quizId)
    .order('order_num', { ascending: true });

  if (questionsError || !questions || questions.length === 0) {
    quizInfo.questions = [];
    return (
        <div className="h-full w-full">
            <QuizPlayer quiz={quizInfo as QuizData} />
        </div>
    );
  }

  // 3. Fetch all options for all of those questions
  const questionIds = questions.map(q => q.id);
  const { data: options, error: optionsError } = await supabase
    .from('question_options')
    .select('*')
    .in('question_id', questionIds);

  if (optionsError) {
    console.error("Error fetching options:", optionsError.message);
  }
  
  // 4. Combine the questions with their options
  const questionsWithPopulatedOptions = questions.map((question): QuizQuestion => {
    return {
      ...question,
      options: options?.filter(opt => opt.question_id === question.id) || [],
    };
  });

  // 5. Assemble the final data object for the component
  const finalQuizData: QuizData = {
    ...quizInfo,
    questions: questionsWithPopulatedOptions,
  };

  return (
    <div className="h-full w-full">
      <QuizPlayer quiz={finalQuizData} />
    </div>
  );
}