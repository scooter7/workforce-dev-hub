// src/components/admin/QuestionManager.tsx

'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import AddQuestionForm from './AddQuestionForm';
import Modal from '@/components/ui/Modal';
import type { QuizQuestion } from '@/types/quiz';
import { Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

interface QuestionManagerProps {
  quizId: string;
}

export function QuestionManager({ quizId }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/quizzes/${quizId}/questions`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Corrected: Prefixed the unused variable with an underscore.
  const handleQuestionAdded = (_newQuestion: QuizQuestion) => {
    // Re-fetch questions to get the definitive list from the server
    fetchQuestions();
    setIsModalOpen(false);
  };

  const handleDelete = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await fetch(
          `/api/admin/quizzes/${quizId}/questions/${questionId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          setQuestions((prev) =>
            prev.filter((q) => q.id !== questionId)
          );
        } else {
          const errorData = await response.json();
          console.error('Failed to delete question:', errorData.error);
        }
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const nextOrderNum = questions.length > 0 ? Math.max(...questions.map(q => q.order_num)) + 1 : 0;

  if (loading) return <div>Loading questions...</div>;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Manage Questions</h2>
        <Button onClick={() => setIsModalOpen(true)}>Add New Question</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddQuestionForm
          quizId={quizId}
          onQuestionAdded={handleQuestionAdded}
          onCancel={() => setIsModalOpen(false)}
          nextOrderNum={nextOrderNum}
        />
      </Modal>

      <div className="space-y-4">
        {questions.length > 0 ? (
          [...questions].sort((a, b) => a.order_num - b.order_num).map((q) => (
            <div
              key={q.id}
              className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">({q.order_num}) {q.question_text}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Type: {q.question_type} | Points: {q.points}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/admin/quizzes/${quizId}/questions/${q.id}/edit`}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                  title="Edit Question"
                >
                  <Edit size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-md"
                  title="Delete Question"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No questions have been added to this quiz yet.
          </p>
        )}
      </div>
    </div>
  );
}
