import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation'; // This is used
import Link from 'next/link';
import { workforceTopics, Topic } from '@/lib/constants';
import { PuzzlePieceIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { QuizTeaser } from '@/types/quiz'; // <<< UPDATED: Import QuizTeaser

export const metadata = {
  title: 'Quizzes',
};

// The local QuizTeaser interface definition has been removed.

// Fetch quizzes directly in the Server Component
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
      created_at, /* Added created_at for potential sorting or display */
      quiz_questions ( count )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching quizzes directly in page:", error);
    return [];
  }

  // Ensure the mapping matches the QuizTeaser interface from '@/types/quiz'
  return quizzes?.map((q: any) => ({
    id: q.id,
    topic_id: q.topic_id,
    subtopic_id: q.subtopic_id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    created_at: q.created_at, // Ensure this is part of QuizTeaser if you want to use it
    // @ts-ignore
    question_count: q.quiz_questions && q.quiz_questions.length > 0 ? q.quiz_questions[0].count : 0,
  })) || [];
}


export default async function QuizzesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to view quizzes.');
  }

  const allQuizzes = await getQuizzesFromAPI(supabase);

  const quizzesByTopic: Record<string, QuizTeaser[]> = {};
  allQuizzes.forEach(quiz => {
    // Ensure quiz.topic_id is not null or undefined before using it as a key
    if (quiz.topic_id) {
        if (!quizzesByTopic[quiz.topic_id]) {
            quizzesByTopic[quiz.topic_id] = [];
        }
        quizzesByTopic[quiz.topic_id].push(quiz);
    } else {
        // Handle quizzes with no topic_id if that's possible, e.g., group them under "General"
        // For now, we assume topic_id will be present for grouping.
        console.warn(`Quiz with ID ${quiz.id} has no topic_id and won't be grouped.`);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-text">
          Workforce Development Quizzes
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Test your knowledge and earn points! Select a topic to see available quizzes.
        </p>
      </div>

      {workforceTopics.map((topic: Topic) => {
        const topicQuizzes = quizzesByTopic[topic.id] || [];
        
        return (
          <section key={topic.id} className="mb-10">
            <h2 className="text-2xl font-semibold text-neutral-text mb-2 border-b-2 pb-2" style={{borderColor: topic.color || '#cbd5e1'}}>
              {topic.title}
            </h2>
            {topicQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {topicQuizzes.map((quiz) => (
                  <Link href={`/quizzes/${quiz.id}`} key={quiz.id} className="group">
                    <div className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out h-full transform hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center mb-3">
                          <PuzzlePieceIcon className="h-8 w-8 text-brand-primary mr-3 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-brand-primary group-hover:text-brand-primary-dark">
                            {quiz.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 min-h-[40px]">
                          {quiz.description || 'A quiz to test your knowledge on this topic.'}
                        </p>
                      </div>
                      <div className="mt-auto flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span className="capitalize">{quiz.difficulty || 'General'} | {quiz.question_count || 'N/A'} Questions</span>
                        <span className="inline-flex items-center font-medium text-brand-primary group-hover:text-brand-primary-dark">
                          Start Quiz <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-4 italic">
                No quizzes currently available for this topic. Check back soon!
              </p>
            )}
          </section>
        );
      })}

      {allQuizzes.length === 0 && (
        <div className="text-center py-10">
          <PuzzlePieceIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">No quizzes available at the moment.</p>
        </div>
      )}
    </div>
  );
}