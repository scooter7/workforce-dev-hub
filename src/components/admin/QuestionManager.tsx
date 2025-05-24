'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/app/(dashboard)/quizzes/[quizId]/page'; // Reuse types
import AddQuestionForm from './AddQuestionForm'; // The form component
import Button from '@/components/ui/Button'; // <<< ADD THIS IMPORT
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface QuestionManagerProps {
  quizId: string;
  initialQuestions: Array<Omit<QuizQuestion, 'options'> & { options: Array<{id: string, option_text: string, is_correct: boolean}> }>;
}

export default function QuestionManager({ quizId, initialQuestions }: QuestionManagerProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [showAddForm, setShowAddForm] = useState(false);
  // TODO: Add state for editingQuestion if implementing edit functionality

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const handleQuestionAdded = (newQuestion: any) => { 
    setQuestions(prev => [...prev, newQuestion]);
    setShowAddForm(false); 
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question and its options?')) return;
    console.log(`TODO: Delete question ${questionId} for quiz ${quizId}`);
    // API call to DELETE /api/admin/quizzes/[quizId]/questions/[questionId]
    // On success:
    // setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Existing Questions ({questions.length})</h2>
        {questions.length > 0 ? (
          <ul className="space-y-3">
            {questions.map((q, index) => (
              <li key={q.id} className="p-4 bg-gray-50 rounded-md shadow-sm border">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium">Q{q.order_num || index + 1}: {q.question_text}</p>
                        <p className="text-xs text-gray-500">Type: {q.question_type} | Points: {q.points}</p>
                        {q.question_type === 'multiple-choice' && q.options && (
                        <ul className="list-disc list-inside pl-4 mt-1 text-sm">
                            {q.options.map(opt => (
                            <li key={opt.id} className={opt.is_correct ? 'font-semibold text-green-600' : ''}>
                                {opt.option_text} {opt.is_correct ? '(Correct)' : ''}
                            </li>
                            ))}
                        </ul>
                        )}
                        {q.explanation && <p className="text-xs italic text-gray-600 mt-1">Explanation: {q.explanation}</p>}
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                        {/* <button className="text-blue-500 hover:text-blue-700 p-1"><PencilIcon className="h-5 w-5"/></button> */}
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No questions added to this quiz yet.</p>
        )}
      </div>

      <div className="mt-8">
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} variant="secondary">
            Add New Question
          </Button>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Add New Question</h2>
            <AddQuestionForm
              quizId={quizId}
              onQuestionAdded={handleQuestionAdded}
              onCancel={() => setShowAddForm(false)}
              nextOrderNum={questions.length > 0 ? Math.max(...questions.map(q => q.order_num || 0)) + 1 : 1}
            />
          </div>
        )}
      </div>
    </div>
  );
}