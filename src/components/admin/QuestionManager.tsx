'use client';

import { useState, useEffect } from 'react';
// UPDATED IMPORT: Get types from the centralized types file
import { QuizQuestion, QuestionOption } from '@/types/quiz';
import AddQuestionForm from './AddQuestionForm';
import Button from '@/components/ui/Button';
import { TrashIcon } from '@heroicons/react/24/outline';

// Define the expected structure for initialQuestions prop more precisely
// This should match the structure returned by `getQuizForAdmin` in the admin page
interface AdminQuizQuestionDisplay extends Omit<QuizQuestion, 'options' | 'quiz_id'> {
  // quiz_id is already available as a prop to QuestionManager
  // options array for admin display will include is_correct
  options: Array<Omit<QuestionOption, 'question_id'>>; // question_id is implicit
}

interface QuestionManagerProps {
  quizId: string;
  initialQuestions: AdminQuizQuestionDisplay[];
}

export default function QuestionManager({ quizId, initialQuestions }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<AdminQuizQuestionDisplay[]>(initialQuestions);
  const [showAddForm, setShowAddForm] = useState(false);
  // const [editingQuestion, setEditingQuestion] = useState<AdminQuizQuestionDisplay | null>(null); // For future edit

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const handleQuestionAdded = (newQuestionFullData: QuizQuestion) => { // API returns full QuizQuestion
    // Adapt the newQuestionFullData to AdminQuizQuestionDisplay if necessary before setting state
    // For now, let's assume direct compatibility or simplify
    const adaptedQuestion: AdminQuizQuestionDisplay = {
        id: newQuestionFullData.id,
        question_text: newQuestionFullData.question_text,
        question_type: newQuestionFullData.question_type,
        explanation: newQuestionFullData.explanation,
        points: newQuestionFullData.points,
        order_num: newQuestionFullData.order_num,
        options: newQuestionFullData.options.map(opt => ({ // Ensure options match expected structure
            id: opt.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct === true // Ensure it's a boolean
        }))
    };
    setQuestions(prev => [...prev, adaptedQuestion]);
    setShowAddForm(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question and its options? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete question.');
      }
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      // Add a success message/toast
      alert('Question deleted successfully.');
    } catch (error: any) {
      console.error("Delete question error:", error);
      alert(`Error deleting question: ${error.message}`);
    }
  };
  
  // const handleEditQuestion = (question: AdminQuizQuestionDisplay) => {
  //   setEditingQuestion(question);
  //   setShowAddForm(true); // Or a dedicated edit form/modal
  // };


  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Existing Questions ({questions.length})</h2>
          {!showAddForm && (
            <Button onClick={() => { /*setEditingQuestion(null);*/ setShowAddForm(true); }} variant="secondary">
              Add New Question
            </Button>
          )}
        </div>
        {questions.length > 0 ? (
          <ul className="space-y-3">
            {questions.map((q, index) => (
              <li key={q.id} className="p-4 bg-gray-50 rounded-md shadow-sm border">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium text-gray-800">Q{q.order_num || index + 1}: {q.question_text}</p>
                        <p className="text-xs text-gray-500 capitalize">Type: {q.question_type.replace('_', '-')} | Points: {q.points}</p>
                        {q.question_type === 'multiple-choice' && q.options && q.options.length > 0 && (
                        <ul className="list-disc list-inside pl-5 mt-1 text-sm space-y-0.5">
                            {q.options.map(opt => (
                            <li key={opt.id} className={opt.is_correct ? 'font-semibold text-green-700' : 'text-gray-600'}>
                                {opt.option_text} {opt.is_correct ? <span className="text-green-500">(Correct)</span> : ''}
                            </li>
                            ))}
                        </ul>
                        )}
                        {q.explanation && <p className="text-xs italic text-gray-600 mt-2">Explanation: {q.explanation}</p>}
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                        {/* <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(q)} className="p-1.5 text-blue-600 hover:text-blue-800" title="Edit Question">
                            <PencilIcon className="h-5 w-5"/>
                        </Button> */}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete Question">
                            <TrashIcon className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !showAddForm && <p className="text-gray-500 py-4">No questions added to this quiz yet.</p>
        )}
      </div>

      {showAddForm && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              {/* {editingQuestion ? 'Edit Question' : 'Add New Question'} */}
              Add New Question
            </h2>
            <AddQuestionForm
              quizId={quizId}
              // initialData={editingQuestion} // For future edit form
              onQuestionAdded={handleQuestionAdded}
              onCancel={() => { setShowAddForm(false); /*setEditingQuestion(null);*/ }}
              nextOrderNum={questions.length > 0 ? Math.max(...questions.map(q => q.order_num || 0)) + 1 : 1}
            />
          </div>
        )}
    </div>
  );
}