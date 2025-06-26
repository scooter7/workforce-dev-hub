'use client';

import { useState } from 'react';
import Link from 'next/link';
// We need the router to refresh the server-side data cache
import { useRouter } from 'next/navigation';

// Define the shape of the quiz prop
interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface QuizListProps {
  initialQuizzes: Quiz[];
}

export default function QuizList({ initialQuizzes }: QuizListProps) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  // Get the router instance
  const router = useRouter();

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action is permanent and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quiz.');
      }

      // First, update the local state for an instant UI update
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      
      // THEN, tell Next.js to refresh the page. This will re-fetch the data
      // on the server and ensure the cache is up-to-date for the next visit.
      router.refresh();

    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <li key={quiz.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-grow mb-4 md:mb-0">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{quiz.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{quiz.description || 'No description provided.'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Created: {new Date(quiz.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* START OF CHANGE - ADD EDIT BUTTON */}
                <Link href={`/admin/quizzes/${quiz.id}/edit`} passHref>
                    <button className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Edit</button>
                </Link>
                {/* END OF CHANGE */}
                <Link href={`/admin/quizzes/${quiz.id}/manage`} passHref>
                    <button className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Manage</button>
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="p-4 text-center text-gray-500">No quizzes found.</li>
        )}
      </ul>
    </div>
  );
}