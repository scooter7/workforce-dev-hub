// src/app/(dashboard)/quizzes/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { workforceTopics, Topic } from '@/lib/constants';
import QuizCard from '@/components/quizzes/QuizCard';
import { QuizTeaser } from '@/types/quiz';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Quizzes',
};

// Now include userId so we can fetch attempts
async function getQuizzesFromAPI(
  supabaseClient: any,
  userId: string
): Promise<(QuizTeaser & { completed: boolean })[]> {
  // 1️⃣ Fetch all quizzes
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

  // 2️⃣ Fetch this user’s completed quiz attempts
  const { data: attempts, error: attErr } = await supabaseClient
    .from('quiz_attempts')
    .select('quiz_id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (attErr) {
    console.error("Error fetching quiz attempts:", attErr);
  }
  const completedSet = new Set((attempts || []).map((a: any) => a.quiz_id));

  // 3️⃣ Map and annotate
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
      completed: completedSet.has(q.id),          // ← new flag
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
    return redirect(
      '/login?message=Please log in to view quizzes.'
    );
  }

  // pass user.id so we can annotate completed
  const allQuizzes = await getQuizzesFromAPI(supabase, user.id);

  // rest of your grouping logic remains unchanged...
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
      {/* ... header omitted for brevity ... */}

      {workforceTopics.map((topic: Topic) => (
        <section key={topic.id} className="mb-10">
          {/* ... topic header ... */}

          {/* Main-topic quizzes */}
          {quizzesByMainTopicOnly[topic.id]?.length > 0 && (
            <div className="grid ...">
              {quizzesByMainTopicOnly[topic.id].map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}

          {/* Subtopic quizzes */}
          {topic.subtopics.map((sub) => {
            const subQs = quizzesByTopicAndSubtopic[topic.id]?.[sub.id] || [];
            return subQs.length > 0 ? (
              <div key={sub.id} className="mt-6">
                {/* ... subtopic header ... */}
                <div className="grid ...">
                  {subQs.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </div>
            ) : null;
          })}

          {/* No quizzes message */}
          {/* ... */}
        </section>
      ))}

      {/* no quizzes overall message */}
      {/* ... */}
    </div>
  );
}
