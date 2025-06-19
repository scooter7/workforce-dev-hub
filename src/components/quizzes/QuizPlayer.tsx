// src/components/quizzes/QuizPlayer.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { QuizData, QuestionOption, QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, AlertTriangleIcon } from '@heroicons/react/24/solid';

interface QuizPlayerProps {
  quiz: QuizData;
}

// Helper component to render media (video or image)
const QuestionMedia = ({ question }: { question: QuizQuestion }) => {
  if (question.video_url) {
    // This logic helps construct a valid embeddable URL for YouTube videos
    let videoSrc = question.video_url;
    if (videoSrc.includes('youtube.com/watch?v=')) {
      const videoId = videoSrc.split('v=')[1].split('&')[0];
      videoSrc = `https://www.youtube.com/embed/${videoId}`;
    }
    return (
      <div className="w-full aspect-video my-4 rounded-lg overflow-hidden shadow-md bg-black">
        <iframe
          key={question.id}
          width="100%"
          height="100%"
          src={videoSrc}
          title="Question Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  if (question.image_url) {
    return (
      <div className="w-full my-4">
        <img 
          src={question.image_url} 
          alt="Question context" 
          className="rounded-lg max-w-full h-auto mx-auto shadow-md"
        />
      </div>
    );
  }

  return null;
};


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

  // Guard against missing or empty questions array
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Quiz Not Available</h2>
        <p className="mt-4 text-lg">This quiz does not have any questions loaded.</p>
        <Button onClick={() => router.push('/quizzes')} className="mt-6">Back to Quizzes</Button>
      </div>
    );
  }

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
    const selectedOption = currentQuestion.options?.find(o => o.id === selectedOptionId);
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
      await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });
      toast.success('Quiz completed and results saved!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('There was an error saving your results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonClass = (option: QuestionOption) => {
    const baseClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between";
    if (!isAnswered) {
      return `${baseClass} ${selectedOptionId === option.id 
        ? 'bg-blue-500 text-white border-blue-500' 
        : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'}`;
    }
    if (option.is_correct) {
      return `${baseClass} bg-green-500 text-white border-green-500`;
    }
    if (selectedOptionId === option.id && !option.is_correct) {
      return `${baseClass} bg-red-500 text-white border-red-500`;
    }
    return `${baseClass} bg-white opacity-60 text-gray-800 border-gray-300`;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl">
        {!isFinished ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
              {currentQuestion?.media_position !== 'below_text' && <QuestionMedia question={currentQuestion} />}
              <h2 className="text-2xl font-bold mt-4">{currentQuestion?.question_text || 'Loading question...'}</h2>
              {currentQuestion?.media_position === 'below_text' && <QuestionMedia question={currentQuestion} />}
            </div>
            
            <div className="space-y-3">
              {/* --- THIS IS THE KEY FIX --- */}
              {/* Check if options exist and are an array before trying to map them */}
              {(currentQuestion?.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) ? (
                currentQuestion.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={isAnswered}
                    className={getButtonClass(option)}
                  >
                    <span className="flex-grow mr-4">{option.option_text}</span>
                    {isAnswered && option.is_correct && <CheckCircleIcon className="h-6 w-6 text-white flex-shrink-0" />}
                    {isAnswered && selectedOptionId === option.id && !option.is_correct && <XCircleIcon className="h-6 w-6 text-white flex-shrink-0" />}
                  </button>
                ))
              ) : (
                // If options are missing, display a clear error message
                <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                  <p className="font-bold">Error: Response options are missing for this question.</p>
                  <p className="text-sm mt-1">Please check the quiz data in the admin panel.</p>
                </div>
              )}
            </div>

            {isAnswered && currentQuestion.explanation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                </div>
            )}

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