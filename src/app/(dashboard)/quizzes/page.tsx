// src/app/(dashboard)/quizzes/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { workforceTopics, Topic } from '@/lib/constants';
import QuizCard from '@/components/quizzes/QuizCard';
import { QuizTeaser } from '@/types/quiz';

export const metadata = {
  title: 'Quizzes',
};

// Annotates quizzes with `completed` based on the current user’s attempts
async function getQuizzesFromAPI(
  supabaseClient: any,
  userId: string
): Promise<(QuizTeaser & { completed: boolean })[]> {
  // 1) Fetch all quizzes
  const { data: quizzes, error: quizErr } = await supabaseClient
    .from('quizzes')
    .select(`
      id, 
      topic_id, 
      subtopic_id, 
      title, 
      description, 
      difficulty, 
      created_at, 
      card_image_url, 
      quiz_questions ( count )
    `)
    .order('created_at', { ascending: false });

  if (quizErr) {
    console.error("Error fetching quizzes:", quizErr);
    return [];
  }

  // 2) Fetch this user’s completed quiz attempts
  const { data: attempts, error: attErr } = await supabaseClient
    .from('quiz_attempts')
    .select('quiz_id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (attErr) {
    console.error("Error fetching quiz attempts:", attErr);
  }
  const completedSet = new Set((attempts || []).map((a: any) => a.quiz_id));

  // 3) Map, annotate, and return
  return (
    quizzes?.map((q: any) => ({
      id: q.id,
      topic_id: q.topic_id,
      subtopic_id: q.subtopic_id,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      created_at: q.created_at,
      card_image_url: q.card_image_url,
      question_count:
        q.quiz_questions && q.quiz_questions.length > 0
          ? q.quiz_questions[0].count
          : 0,
      completed: completedSet.has(q.id),
    })) || []
  );
}

export default async function QuizzesPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/login?message=Please log in to view quizzes.');
  }

  const allQuizzes = await getQuizzesFromAPI(supabase, user.id);

  const quizzesByTopicAndSubtopic: Record<string, Record<string, typeof allQuizzes>> = {};
  const quizzesByMainTopicOnly: Record<string, typeof allQuizzes> = {};

  allQuizzes.forEach((quiz) => {
    if (quiz.topic_id) {
      if (quiz.subtopic_id) {
        quizzesByTopicAndSubtopic[quiz.topic_id] ??= {};
        quizzesByTopicAndSubtopic[quiz.topic_id][quiz.subtopic_id] ??= [];
        quizzesByTopicAndSubtopic[quiz.topic_id][quiz.subtopic_id].push(quiz);
      } else {
        quizzesByMainTopicOnly[quiz.topic_id] ??= [];
        quizzesByMainTopicOnly[quiz.topic_id].push(quiz);
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-text">
          Power Skills Quizzes
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Test your knowledge and earn points! Select a topic to see available quizzes.
        </p>
      </div>

      {workforceTopics.map((topic: Topic) => (
        <section key={topic.id} className="mb-10">
          <h2
            className="text-2xl font-semibold text-neutral-text mb-3 border-b-2 pb-2"
            style={{ borderColor: topic.color || '#cbd5e1' }}
          >
            {topic.title}
          </h2>

          {quizzesByMainTopicOnly[topic.id]?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-4">
              {quizzesByMainTopicOnly[topic.id].map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}

          {topic.subtopics.map((sub) => {
            const subQs = quizzesByTopicAndSubtopic[topic.id]?.[sub.id] || [];
            return subQs.length > 0 ? (
              <div key={sub.id} className="mt-6">
                <h3 className="text-xl font-medium text-neutral-text-light mb-2 pl-2">
                  {sub.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {subQs.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </div>
            ) : null;
          })}

          {(!quizzesByMainTopicOnly[topic.id] ||
            quizzesByMainTopicOnly[topic.id].length === 0) &&
            topic.subtopics.every(
              (st) =>
                !quizzesByTopicAndSubtopic[topic.id]?.[st.id]?.length
            ) && (
              <p className="text-gray-500 mt-4 italic">
                No quizzes currently available for this topic or its subtopics.
              </p>
            )}
        </section>
      ))}
    </div>
  );
}
