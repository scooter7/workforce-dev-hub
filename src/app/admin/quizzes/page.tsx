import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PlusCircleIcon, UploadIcon } from '@heroicons/react/24/solid';
import QuizList from './QuizList'; // We'll define this client component below

// This server component fetches all quizzes from the database.
export default async function AdminQuizzesDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching quizzes for admin dashboard:", error);
    // Render an error state, but don't crash the page
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quiz Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage, create, and delete all quizzes.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/quizzes/new" passHref>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Create New Quiz
            </button>
          </Link>
          <Link href="/admin/quizzes/bulk-upload" passHref>
            <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <UploadIcon className="h-5 w-5 mr-2" />
                Bulk Upload
            </button>
          </Link>
        </div>
      </div>
      
      {/* We pass the fetched quizzes to a Client Component.
        This is a standard pattern in Next.js: fetch data on the server,
        but handle user interactions (like clicking delete) on the client.
      */}
      <QuizList initialQuizzes={quizzes || []} />

    </div>
  );
}
