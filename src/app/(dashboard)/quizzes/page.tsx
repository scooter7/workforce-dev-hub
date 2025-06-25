import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { workforceTopics } from '@/lib/constants';
import QuizCard from '@/components/quizzes/QuizCard';
import { QuizTeaser } from '@/types/quiz';
import { groupQuizzesByTopic } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Power Skills Quizzes',
  description: 'Test your knowledge and earn points!',
};

export const revalidate = 0;

export default async function QuizzesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      topic_id,
      subtopic_id,
      difficulty,
      card_image_url,
      questions:quiz_questions(count)
    `);

  if (quizzesError) {
    console.error('Error fetching quizzes:', quizzesError);
    return <div>Error loading quizzes. Please try again later.</div>;
  }

  const { data: completedQuizzesData, error: completedError } = await supabase
    .from('quiz_attempts')
    .select('quiz_id')
    .eq('user_id', user.id)
    .eq('status', 'completed');
  
  if (completedError) {
    console.error('Error fetching completed quizzes:', completedError);
  }

  const completedQuizIds = new Set(completedQuizzesData?.map(a => a.quiz_id) || []);
  
  const quizzesWithDynamicData = quizzes.map(q => {
    const questionCount = Array.isArray(q.questions) ? q.questions[0]?.count || 0 : 0;
    
    return {
      ...q,
      question_count: questionCount,
      completed: completedQuizIds.has(q.id),
    } as QuizTeaser & { completed: boolean };
  });

  const { quizzesBySubtopic, quizzesByMainTopicOnly } = groupQuizzesByTopic(quizzesWithDynamicData, workforceTopics);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-text">Power Skills Quizzes</h1>
        <p className="mt-2 text-lg text-gray-600">
          Test your knowledge and earn points! Select a topic to see available quizzes.
        </p>
      </div>

      <div className="space-y-12">
        {workforceTopics.map((topic) => {
          const hasSubtopicQuizzes = topic.subtopics.some(sub => quizzesBySubtopic[sub.id]?.length > 0);
          const hasMainTopicQuizzes = quizzesByMainTopicOnly[topic.id]?.length > 0;

          if (!hasSubtopicQuizzes && !hasMainTopicQuizzes) {
            return null;
          }
          
          // The 'topicIndex' constant that was here has been removed.

          return (
            <section key={topic.id}>
              <h2
                className="text-2xl font-semibold text-neutral-text mb-2 border-b-2 pb-2"
                style={{ borderColor: topic.color || '#cbd5e1' }}
              >
                {topic.title}
              </h2>
              
              {topic.subtopics.map((subtopic) => (
                quizzesBySubtopic[subtopic.id] && quizzesBySubtopic[subtopic.id].length > 0 && (
                  <div key={subtopic.id} className="mt-6">
                    <h3 className="text-lg font-semibold text-neutral-text mb-1">{subtopic.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-4">
                      {quizzesBySubtopic[subtopic.id].map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} />
                      ))}
                    </div>
                  </div>
                )
              ))}

              {quizzesByMainTopicOnly[topic.id] && quizzesByMainTopicOnly[topic.id].length > 0 && (
                <div className="mt-6">
                  {hasSubtopicQuizzes && <h3 className="text-lg font-semibold text-neutral-text mb-1">General</h3>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-4">
                    {quizzesByMainTopicOnly[topic.id].map((quiz) => (
                      <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}