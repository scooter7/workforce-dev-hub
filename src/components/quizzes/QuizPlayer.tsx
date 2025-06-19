// src/components/quizzes/QuizPlayer.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { QuizData, QuestionOption } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface QuizPlayerProps {
  quiz: QuizData;
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; answerId: string; isCorrect: boolean }[]>([]);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleAnswerSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionId === null) {
      toast.error('Please select an answer.');
      return;
    }
    const selectedOption = currentQuestion.options.find(o => o.id === selectedOptionId);
    const isCorrect = selectedOption?.is_correct || false;
    if (isCorrect) {
      setScore(prev => prev + (currentQuestion.points || 1));
    }
    setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, answerId: selectedOptionId, isCorrect }]);
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      submitQuizResults();
    }
  };
  
  const submitQuizResults = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          answers: userAnswers,
          finalScore: score,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit quiz results.');
      toast.success('Quiz completed and results saved!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('There was an error saving your results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonClass = (option: QuestionOption) => {
    // Default state: Add text-gray-800 to ensure visibility on white background
    if (!isAnswered) {
      return selectedOptionId === option.id 
        ? 'bg-blue-500 text-white border-blue-500' 
        : 'bg-white hover:bg-gray-100 text-gray-800';
    }
    
    // Answered states
    if (option.is_correct) {
      return 'bg-green-500 text-white border-green-500';
    }
    if (selectedOptionId === option.id && !option.is_correct) {
      return 'bg-red-500 text-white border-red-500';
    }
    
    // Default for incorrect, unselected options after answering
    return 'bg-white opacity-60 text-gray-800';
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/quizbackground.png')" }}
    >
      <div className="bg-white bg-opacity-95 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl">
        {!isFinished ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
              <h2 className="text-2xl font-bold mt-1">{currentQuestion.question_text}</h2>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${getButtonClass(option)}`}
                >
                  <span className="flex-grow">{option.option_text}</span>
                  {isAnswered && option.is_correct && <CheckCircleIcon className="h-6 w-6 text-white" />}
                  {isAnswered && selectedOptionId === option.id && !option.is_correct && <XCircleIcon className="h-6 w-6 text-white" />}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              {isAnswered ? (
                <Button onClick={handleNextQuestion}>
                  {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              ) : (
                <Button onClick={handleSubmitAnswer} disabled={selectedOptionId === null}>
                  Submit Answer
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Quiz Completed!</h2>
            <p className="text-xl mb-6">Your score: {score} / {quiz.questions.reduce((total, q) => total + (q.points || 1), 0)}</p>
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <ArrowPathIcon className="h-6 w-6 animate-spin" />
                <span>Saving your results...</span>
              </div>
            ) : (
              <Button onClick={() => router.push('/quizzes')}>
                Back to Quizzes
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}