'use client';

import { useState, useEffect, FormEvent } from 'react';
import { QuizData, QuizQuestion, QuestionOption } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface QuizPlayerProps {
  quizId: string; // Changed from quizData
  userId: string;
  attemptId?: string; // Optional: if you are managing attempts from the parent
}

type UserAnswers = Record<string, string>;

export default function QuizPlayer({ quizId, userId, attemptId }: QuizPlayerProps) {
  const router = useRouter();

  // State for fetched quiz data
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizFetchError, setQuizFetchError] = useState<string | null>(null);

  // State for quiz interaction
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For submission loading
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    pointsAwarded: number;
    userChoices?: Record<string, { selected: string | null; correct: boolean; explanation?: string | null }>;
  } | null>(null);

  // Fetch quiz data when component mounts or quizId changes
  useEffect(() => {
    if (!quizId) return;

    setIsLoadingQuiz(true);
    setQuizFetchError(null);
    setQuizData(null); // Reset previous quiz data
    // Reset interaction state when fetching new quiz
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setResults(null);

    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${quizId}/questions`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({})); // Try to parse error
          throw new Error(errData.error || `Failed to load quiz (Status: ${response.status})`);
        }
        const data: QuizData = await response.json();
        if (!data || !data.questions) {
            throw new Error("Quiz data or questions missing in API response.");
        }
        setQuizData(data);
      } catch (error: any) {
        console.error("Failed to load quiz data:", error);
        setQuizFetchError(error.message || "An unexpected error occurred while loading the quiz.");
      } finally {
        setIsLoadingQuiz(false);
      }
    }

    fetchQuiz();
  }, [quizId]);


  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (quizCompleted) return;
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: optionId,
    }));
  };

  const goToNextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    setIsSubmitting(true);
    setQuizCompleted(true);

    const submission = {
      quizId: quizData.id,
      userId,
      attemptId,
      answers: Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    };

    console.log('Submitting quiz with fetched data:', submission);

    try {
      const response = await fetch(`/api/quizzes/${quizData.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to submit quiz (Status: ${response.status})`);
      }

      const resultData = await response.json();
      setResults(resultData);

    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setResults({
        score: 0,
        totalQuestions: quizData.questions.length,
        pointsAwarded: 0,
      });
      // Consider setting a submission error message to display to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (isLoadingQuiz) {
    return <div className="text-center p-8 animate-pulse">Loading quiz questions...</div>;
  }

  if (quizFetchError) {
    return <div className="text-center p-8 text-red-600">Error: {quizFetchError}</div>;
  }

  if (!quizData || quizData.questions.length === 0) {
    return <div className="text-center p-8">This quiz is currently unavailable or has no questions.</div>;
  }

  // (The rest of the rendering logic for quiz questions, results, and navigation remains largely the same)
  // ... but now it uses the `quizData` from state.

  if (isSubmitting && quizCompleted) { // Changed isLoading to isSubmitting
    return <div className="text-center p-8">Submitting and grading your quiz... Please wait.</div>;
  }

  if (quizCompleted && results) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center text-brand-primary">Quiz Completed!</h2>
        <p className="text-xl text-center mb-2">
          Your Score: <span className="font-bold">{results.score}</span> / {results.totalQuestions}
        </p>
        <p className="text-lg text-center mb-6">
          Points Awarded: <span className="font-bold text-green-600">+{results.pointsAwarded}</span>
        </p>
        <div className="my-6 space-y-4">
          <h3 className="text-lg font-semibold">Review Your Answers:</h3>
          {quizData.questions.map((q, idx) => {
            const choiceInfo = results.userChoices?.[q.id];
            return (
              <div key={q.id} className={`p-3 rounded-md ${choiceInfo?.correct ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
                <p className="font-medium">{idx + 1}. {q.question_text}</p>
                <p className="text-sm">Your answer: {q.options.find(opt => opt.id === choiceInfo?.selected)?.option_text || 'Not answered'}</p>
                {!choiceInfo?.correct && q.options.find(opt => opt.id === choiceInfo?.selected) && (
                  <p className="text-sm text-green-700">Correct answer: (Details from server needed here if different from options provided)</p>
                )}
                {choiceInfo?.explanation && <p className="text-xs mt-1 italic">{choiceInfo.explanation}</p>}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => router.push('/quizzes')} variant="primary">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // Current question for display (ensure quizData is loaded)
  const currentDisplayQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  if (!currentDisplayQuestion && !quizCompleted) {
    // This might happen briefly if quizData is set but index is out of bounds initially
    return <div className="text-center p-8">Loading question...</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl flex flex-col h-full">
      <div className="mb-4 text-sm text-gray-600">
        Question {currentQuestionIndex + 1} of {quizData.questions.length}
      </div>

      {currentDisplayQuestion && (
        <div className="mb-6 flex-grow">
          <h2 className="text-xl font-semibold text-neutral-text mb-4">
            {currentDisplayQuestion.question_text}
          </h2>
          {currentDisplayQuestion.question_type === 'multiple-choice' && (
            <div className="space-y-3">
              {currentDisplayQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
                    ${ userAnswers[currentDisplayQuestion.id] === option.id
                        ? 'bg-brand-primary-light border-brand-primary ring-2 ring-brand-primary'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentDisplayQuestion.id}`}
                    value={option.id}
                    checked={userAnswers[currentDisplayQuestion.id] === option.id}
                    onChange={() => handleOptionSelect(currentDisplayQuestion.id, option.id)}
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3"
                  />
                  <span>{option.option_text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center">
        <Button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0 || quizCompleted}
          variant="outline"
        >
          Previous
        </Button>
        {currentQuestionIndex < quizData.questions.length - 1 ? (
          <Button
            onClick={goToNextQuestion}
            disabled={quizCompleted}
            variant="primary"
          >
            Next Question
          </Button>
        ) : (
          <Button
            onClick={handleSubmitQuiz}
            disabled={quizCompleted || isSubmitting}
            variant="success"
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
}