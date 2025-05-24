import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { workforceTopics, Topic } from '@/lib/constants';
import { PuzzlePieceIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export const metadata = {
  title: 'Quizzes',
};

// This type should match what your API returns and what the page needs
export interface QuizTeaser {
  id: string;
  topic_id: string;
  subtopic_id?: string | null;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  question_count?: number;
}

// Fetch quizzes directly in the Server Component
async function getQuizzesFromAPI(supabaseClient: any): Promise<QuizTeaser[]> {
  // This function now simulates what would be a direct fetch from the API
  // if this page were a client component, or direct DB access for server component.
  // For a Server Component, direct DB access is fine.
  // The API GET /api/quizzes exists for other client-side needs or as a dedicated resource.

  const { data: quizzes, error } = await supabaseClient
    .from('quizzes')
    .select(`
      id,
      topic_id,
      subtopic_id,
      title,
      description,
      difficulty,
      quiz_questions ( count )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching quizzes directly in page:", error);
    return [];
  }

  return quizzes?.map((q: any) => ({ // Add 'any' for q to handle Supabase's dynamic structure here
    id: q.id,
    topic_id: q.topic_id,
    subtopic_id: q.subtopic_id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    question_count: q.quiz_questions && q.quiz_questions.length > 0 ? q.quiz_questions[0].count : 0,
  })) || [];
}


export default async function QuizzesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to view quizzes.');
  }

  // Fetch real quizzes directly since this is a Server Component
  const allQuizzes = await getQuizzesFromAPI(supabase);

  const quizzesByTopic: Record<string, QuizTeaser[]> = {};
  allQuizzes.forEach(quiz => {
    if (!quizzesByTopic[quiz.topic_id]) {
      quizzesByTopic[quiz.topic_id] = [];
    }
    quizzesByTopic[quiz.topic_id].push(quiz);
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
        // Decide if you want to show topics even if they have no quizzes yet
        // if (topicQuizzes.length === 0) {
        //     return null;
        // }

        return (
          <section key={topic.id} className="mb-10">
            <h2 className="text-2xl font-semibold text-neutral-text mb-2 border-b-2 pb-2" style={{borderColor: topic.color || '#cbd5e1'}}>
              {topic.title}
            </h2>
            {topicQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {topicQuizzes.map((quiz) => (
                  <Link href={`/quizzes/${quiz.id}`} key={quiz.id} className="group">
                    <div className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out h-full transform hover:-translate-y-1">
                      <div className="flex items-center mb-3">
                        <PuzzlePieceIcon className="h-8 w-8 text-brand-primary mr-3" />
                        <h3 className="text-lg font-semibold text-brand-primary group-hover:text-brand-primary-dark">
                          {quiz.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 min-h-[40px]"> {/* Min height for description */}
                        {quiz.description || 'A quiz to test your knowledge on this topic.'}
                      </p>
                      <div className="mt-auto flex justify-between items-center text-xs text-gray-500">
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