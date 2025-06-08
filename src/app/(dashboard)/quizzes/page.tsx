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

async function getQuizzesFromAPI(supabaseClient: any): Promise<QuizTeaser[]> {
  const { data: quizzes, error } = await supabaseClient
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

  if (error) {
    console.error("Error fetching quizzes:", error);
    return []; 
  }

  return quizzes?.map((q: any) => ({
    id: q.id,
    topic_id: q.topic_id,
    subtopic_id: q.subtopic_id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    created_at: q.created_at,
    card_image_url: q.card_image_url, 
    question_count: q.quiz_questions && q.quiz_questions.length > 0 ? q.quiz_questions[0].count : 0,
  })) || [];
} // <<< End of getQuizzesFromAPI function

// Ensure no stray code between the function above and the component below

export default async function QuizzesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/login?message=Please log in to view quizzes.');
  }

  const allQuizzes = await getQuizzesFromAPI(supabase);

  const quizzesByTopicAndSubtopic: Record<string, Record<string, QuizTeaser[]>> = {};
  const quizzesByMainTopicOnly: Record<string, QuizTeaser[]> = {};

  allQuizzes.forEach(quiz => {
    if (quiz.topic_id) {
      if (quiz.subtopic_id) {
        if (!quizzesByTopicAndSubtopic[quiz.topic_id]) {
          quizzesByTopicAndSubtopic[quiz.topic_id] = {};
        }
        if (!quizzesByTopicAndSubtopic[quiz.topic_id][quiz.subtopic_id]) {
          quizzesByTopicAndSubtopic[quiz.topic_id][quiz.subtopic_id] = [];
        }
        quizzesByTopicAndSubtopic[quiz.topic_id][quiz.subtopic_id].push(quiz);
      } else {
        if (!quizzesByMainTopicOnly[quiz.topic_id]) {
          quizzesByMainTopicOnly[quiz.topic_id] = [];
        }
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
          <h2 className="text-2xl font-semibold text-neutral-text mb-3 border-b-2 pb-2" style={{borderColor: topic.color || '#cbd5e1'}}>
            {topic.title}
          </h2>
          
          {quizzesByMainTopicOnly[topic.id] && quizzesByMainTopicOnly[topic.id].length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-4">
              {quizzesByMainTopicOnly[topic.id].map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}

          {topic.subtopics.map(subtopic => {
            const subtopicQuizzes = quizzesByTopicAndSubtopic[topic.id]?.[subtopic.id] || [];
            return subtopicQuizzes.length > 0 ? (
              <div key={subtopic.id} className="mt-6">
                <h3 className="text-xl font-medium text-neutral-text-light mb-2 pl-2">{subtopic.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {subtopicQuizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </div>
            ) : null;
          })}
          
          {(!quizzesByMainTopicOnly[topic.id] || quizzesByMainTopicOnly[topic.id].length === 0) && 
           topic.subtopics.every(st => (!quizzesByTopicAndSubtopic[topic.id]?.[st.id] || quizzesByTopicAndSubtopic[topic.id]?.[st.id].length === 0)) && (
            <p className="text-gray-500 mt-4 italic">
              No quizzes currently available for this topic or its subtopics.
            </p>
          )}
        </section>
      ))}

      {allQuizzes.length === 0 && (
        <div className="text-center py-10">
          <QuestionMarkCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">No quizzes available at the moment.</p>
        </div>
      )}
    </div>
  );
} // <<< End of QuizzesPage component