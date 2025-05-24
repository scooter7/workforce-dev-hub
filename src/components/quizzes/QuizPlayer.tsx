'use client';

import { useState, useEffect, useRef } from 'react';
import { QuizData, QuizQuestion } from '@/types/quiz'; // Importing main types needed
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface QuizPlayerProps {
  quizId: string;
  userId: string;
  attemptId?: string; // Optional: if you manage attempts from a parent component
}

type UserAnswers = Record<string, string>; // Stores { questionId: selectedOptionId }

export default function QuizPlayer({ quizId, userId, attemptId }: QuizPlayerProps) {
  const router = useRouter();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizFetchError, setQuizFetchError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    pointsAwarded: number;
    userChoices?: Record<string, { selected: string | null; correct: boolean; explanation?: string | null }>;
  } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null); // For scrolling to top of content

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    // Or if you want to scroll the window:
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!quizId) {
      setQuizFetchError("Quiz ID is missing.");
      setIsLoadingQuiz(false);
      return;
    }

    setIsLoadingQuiz(true);
    setQuizFetchError(null);
    setQuizData(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setResults(null);
    setIsSubmitting(false);

    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${quizId}/questions`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load quiz (Status: ${response.status})`);
        }
        const data: QuizData = await response.json();
        if (!data || !data.questions || !Array.isArray(data.questions)) { // Added Array.isArray check
            throw new Error("Quiz data or questions missing/invalid in API response.");
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


  useEffect(() => {
    if (!isLoadingQuiz && quizData) {
        scrollToTop(); // Scroll to top when a new question is displayed
    }
  }, [currentQuestionIndex, isLoadingQuiz, quizData]);


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
    if (!quizData || !quizData.questions) return; // Guard against null quizData

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

    try {
      const response = await fetch(`/api/quizzes/${quizData.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
        throw new Error(errData.error || 'Failed to submit quiz.');
      }

      const resultData = await response.json();
      setResults(resultData);
      scrollToTop();

    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setResults({ // Set a basic error state for results
        score: 0,
        totalQuestions: quizData.questions.length,
        pointsAwarded: 0,
      });
      // You could add an error message to the results state:
      // setResults(prev => ({...prev, submissionError: error.message}));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingQuiz) {
    return <div className="text-center p-8 animate-pulse">Loading quiz questions...</div>;
  }

  if (quizFetchError) {
    return <div className="text-center p-8 text-red-600">Error loading quiz: {quizFetchError}</div>;
  }

  if (!quizData || quizData.questions.length === 0) {
    return <div className="text-center p-8 text-gray-500">This quiz is currently unavailable or has no questions.</div>;
  }

  const currentDisplayQuestion: QuizQuestion | undefined = quizData.questions[currentQuestionIndex];

  if (isSubmitting) {
    return <div className="text-center p-8">Submitting and grading your quiz... Please wait.</div>;
  }

  if (quizCompleted && results) {
    return (
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl" ref={contentRef}>
        <h2 className="text-2xl font-bold mb-4 text-center text-brand-primary">Quiz Completed!</h2>
        <p className="text-xl text-center mb-2">
          Your Score: <span className="font-bold">{results.score}</span> / {results.totalQuestions}
        </p>
        <p className="text-lg text-center mb-6">
          Points Awarded: <span className="font-bold text-green-600">+{results.pointsAwarded}</span>
        </p>
        <div className="my-6 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          <h3 className="text-lg font-semibold text-neutral-text">Review Your Answers:</h3>
          {quizData.questions.map((q, idx) => {
            const choiceInfo = results.userChoices?.[q.id];
            const selectedOption = q.options.find(opt => opt.id === choiceInfo?.selected);
            const selectedOptionText = selectedOption?.option_text;
            
            return (
              <div key={q.id} className={`p-3 rounded-md ${choiceInfo?.correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
                <p className="font-medium text-gray-800">{idx + 1}. {q.question_text}</p>
                <p className="text-sm text-gray-700">Your answer: <span className={choiceInfo?.correct ? "font-semibold text-green-700" : "font-semibold text-red-700"}>{selectedOptionText || (choiceInfo?.selected ? 'N/A - Invalid Option' : 'Not answered')}</span></p>
                {!choiceInfo?.correct && selectedOptionText && (
                   <p className="text-sm text-green-600">Correct Answer: (Details for showing correct answer text would require sending it from API if different from options displayed)</p>
                )}
                {choiceInfo?.explanation && <p className="text-xs mt-1 italic text-gray-600">{choiceInfo.explanation}</p>}
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

  if (!currentDisplayQuestion) {
    // This might happen if quizData is set but questions array is empty,
    // though the earlier check for quizData.questions.length === 0 should catch it.
    return <div className="text-center p-8">Preparing question...</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl flex flex-col min-h-[calc(100vh-200px)] md:min-h-[60vh]" ref={contentRef}> {/* Adjusted min height */}
      <div className="mb-4 text-sm text-gray-600">
        Question {currentQuestionIndex + 1} of {quizData.questions.length}
        {currentDisplayQuestion.points > 0 && ` (${currentDisplayQuestion.points} pts)`}
      </div>

      <div className="mb-6 flex-grow">
        <h2 className="text-xl font-semibold text-neutral-text mb-4 leading-tight">
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
        {currentDisplayQuestion.question_type === 'true-false' && (
           <div className="space-y-3">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${userAnswers[currentDisplayQuestion.id] === 'true' ? 'bg-brand-primary-light border-brand-primary ring-2 ring-brand-primary' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <input type="radio" name={`question-${currentDisplayQuestion.id}`} value="true" checked={userAnswers[currentDisplayQuestion.id] === 'true'} onChange={() => handleOptionSelect(currentDisplayQuestion.id, 'true')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3"/>
                  <span>True</span>
              </label>
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${userAnswers[currentDisplayQuestion.id] === 'false' ? 'bg-brand-primary-light border-brand-primary ring-2 ring-brand-primary' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <input type="radio" name={`question-${currentDisplayQuestion.id}`} value="false" checked={userAnswers[currentDisplayQuestion.id] === 'false'} onChange={() => handleOptionSelect(currentDisplayQuestion.id, 'false')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3"/>
                  <span>False</span>
              </label>
           </div>
        )}
      </div>

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
            disabled={quizCompleted || !userAnswers[currentDisplayQuestion.id]}
            variant="primary"
          >
            Next Question
          </Button>
        ) : (
          <Button
            onClick={handleSubmitQuiz}
            disabled={quizCompleted || isSubmitting || Object.keys(userAnswers).length !== quizData.questions.length}
            variant="primary" // Changed from "success" to an existing variant
            className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500" // Custom styling for green appearance
          >
            {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
}