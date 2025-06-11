'use client';

import { useState } from 'react';
import Link from 'next/link';

// Define the shape of the quiz prop, which matches the data fetched from the database.
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
  // Use state to manage the list of quizzes so the UI can be updated instantly on delete.
  const [quizzes, setQuizzes] = useState(initialQuizzes);

  const handleDelete = async (quizId: string) => {
    // Always ask for user confirmation before a destructive action.
    if (!window.confirm('Are you sure you want to delete this quiz? This action is permanent and cannot be undone.')) {
      return;
    }

    try {
      // Send a DELETE request to the API endpoint for the specific quiz.
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quiz.');
      }

      // If the API call is successful, remove the quiz from the local state.
      // This updates the UI immediately without needing a full page reload.
      setQuizzes((prevQuizzes) => prevQuizzes.filter((q) => q.id !== quizId));
      
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
            <li key={quiz.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{quiz.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{quiz.description || 'No description provided.'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Created: {new Date(quiz.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Link href={`/admin/quizzes/${quiz.id}/manage`} passHref>
                    <button className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                      Manage
                    </button>
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="p-6 text-center text-gray-500">No quizzes have been created yet.</li>
        )}
      </ul>
    </div>
  );
}
