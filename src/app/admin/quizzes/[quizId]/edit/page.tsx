import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditQuizForm from '@/components/admin/EditQuizForm';
import { workforceTopics } from '@/lib/constants';
import { QuizTeaser } from '@/types/quiz';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

async function getQuiz(quizId: string): Promise<QuizTeaser | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, topic_id, subtopic_id, difficulty, card_image_url')
        .eq('id', quizId)
        .single();
    
    if (error) {
        console.error("Failed to fetch quiz for editing:", error);
        return null;
    }

    return data as QuizTeaser;
}


export default async function EditQuizPage({ params }: { params: { quizId: string }}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_USER_ID) {
    redirect('/login');
  }

  const quiz = await getQuiz(params.quizId);

  if (!quiz) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-text mb-6">
        Edit Quiz: {quiz.title}
      </h1>
      <EditQuizForm topics={workforceTopics} quiz={quiz} />
    </div>
  );
}