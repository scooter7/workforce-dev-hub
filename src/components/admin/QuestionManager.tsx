'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/types/quiz'; // QuestionOption import removed as per previous fix
import AddQuestionForm from './AddQuestionForm';
import Button from '@/components/ui/Button';
import { TrashIcon, PencilIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface QuestionManagerProps {
  quizId: string;
  initialQuestions?: QuizQuestion[];
  // quizTitle?: string; // Removed as it was unused
}

export default function QuestionManager({ quizId, initialQuestions = [] }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuestions.length === 0 && quizId) {
      setIsLoading(true);
      fetch(`/api/admin/quizzes/${quizId}/questions?includeOptions=true`) 
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error || 'Failed to fetch questions')});
          }
          return res.json();
        })
        .then(data => {
          setQuestions(data.questions || []);
          setError(null);
        })
        .catch(err => {
          console.error("Error fetching questions:", err);
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    } else {
        setQuestions(initialQuestions);
    }
  }, [quizId, initialQuestions]);

  const handleQuestionAdded = (newQuestion: QuizQuestion) => {
    setQuestions(prev => [...prev, newQuestion].sort((a,b) => a.order_num - b.order_num));
    setShowAddForm(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question and its options? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete question.');
      }
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      alert('Question deleted successfully.');
    } catch (err: any) {
      console.error("Delete question error:", err);
      alert(`Error deleting question: ${err.message}`);
    }
  };
  
  const getNextOrderNum = () => {
    if (questions.length === 0) return 1;
    return Math.max(...questions.map(q => q.order_num)) + 1;
  };

  if (isLoading && questions.length === 0) {
    return <div className="text-center p-4">Loading questions...</div>;
  }

  if (error && questions.length === 0) {
    return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div>
      {showAddForm ? (
        <AddQuestionForm
          quizId={quizId}
          onQuestionAdded={handleQuestionAdded}
          onCancel={() => setShowAddForm(false)}
          nextOrderNum={getNextOrderNum()}
        />
      ) : (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowAddForm(true)} variant="primary" size="sm">
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Add New Question
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <h3 className="text-xl font-semibold text-neutral-text">
          Existing Questions ({questions.length})
        </h3>
        {questions.length === 0 && !isLoading && !error && (
          <p className="text-gray-500 italic">No questions added yet for this quiz.</p>
        )}
        {questions.map((question, index) => (
          <div key={question.id} className="p-4 border border-neutral-border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Q{question.order_num || (index + 1)} (Points: {question.points})</p>
                <p className="mt-1 text-md text-gray-800">{question.question_text}</p>
                <p className="text-xs text-gray-400 mt-0.5">Type: {question.question_type}</p>
                {question.image_url && <p className="text-xs text-blue-500 mt-0.5 truncate">Image: {question.image_url}</p>}
                {question.video_url && <p className="text-xs text-blue-500 mt-0.5 truncate">Video Embed</p>}
              </div>
              <div className="flex space-x-2 flex-shrink-0 ml-4">
                <Link href={`/admin/quizzes/${quizId}/questions/${question.id}/edit`} passHref legacyBehavior>
                  <a className="p-2 text-gray-500 hover:text-brand-primary rounded-md hover:bg-gray-100 transition-colors" title="Edit Question">
                    <PencilIcon className="h-5 w-5" />
                  </a>
                </Link>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete Question"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            {question.options && question.options.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Options:</p>
                <ul className="list-disc list-inside pl-1 space-y-0.5">
                  {question.options.slice(0, 3).map(opt => (
                    <li key={opt.id} className={`text-xs ${opt.is_correct ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {opt.option_text} {opt.is_correct ? '(Correct)' : ''}
                    </li>
                  ))}
                  {question.options.length > 3 && <li className="text-xs text-gray-400 italic">...and more</li>}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}