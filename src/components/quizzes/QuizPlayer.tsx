'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizData, QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface QuizPlayerProps {
  quizId: string;
  userId: string;
  attemptId?: string;
}

type UserAnswers = Record<string, string>;

export default function QuizPlayer({ quizId, userId, attemptId }: QuizPlayerProps) {
  const router = useRouter();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizFetchError, setQuizFetchError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const initialUserAnswers: UserAnswers = {}; // Explicitly typed for useState
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(initialUserAnswers);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentAnswerFeedback, setCurrentAnswerFeedback] = useState<{
    isCorrect: boolean;
    selectedOptionText?: string;
    correctOptionText?: string;
  } | null>(null);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number; totalQuestions: number; pointsAwarded: number;
    userChoices?: Record<string, { selected: string | null; correct: boolean; explanation?: string | null }>;
  } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!quizId) {
      setQuizFetchError("Quiz ID is missing."); setIsLoadingQuiz(false); return;
    }
    setIsLoadingQuiz(true); setQuizFetchError(null); setQuizData(null);
    setCurrentQuestionIndex(0); setUserAnswers({}); setQuizCompleted(false);
    setResults(null); setIsFlipped(false); setCurrentAnswerFeedback(null); setIsSubmitting(false);

    async function fetchQuizInternal() {
      try {
        const response = await fetch(`/api/quizzes/${quizId}/questions`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load quiz (Status: ${response.status})`);
        }
        const data: QuizData = await response.json();
        if (!data || !data.questions || !Array.isArray(data.questions)) {
            throw new Error("Quiz data or questions missing/invalid in API response.");
        }
        setQuizData(data);
      } catch (error: any) {
        console.error("Failed to load quiz data:", error);
        setQuizFetchError(error.message || "An unexpected error occurred while loading the quiz.");
      } finally { setIsLoadingQuiz(false); }
    }
    fetchQuizInternal();
  }, [quizId]);

  useEffect(() => {
    if (!isFlipped && !isLoadingQuiz && quizData) { // Scroll to top when question changes (if card is not flipped)
        scrollToTop();
    }
  }, [currentQuestionIndex, isFlipped, isLoadingQuiz, quizData, scrollToTop]);

  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  const handleOptionSelect = useCallback((questionId: string, selectedOptionId: string) => {
    if (isFlipped || quizCompleted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: selectedOptionId }));

    const question = quizData?.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const selectedOpt = question.options.find(opt => opt.id === selectedOptionId || opt.option_text.toLowerCase() === selectedOptionId.toLowerCase());
      const correctOpt = question.options.find(opt => opt.is_correct);
      setCurrentAnswerFeedback({
        isCorrect: selectedOpt?.is_correct || false,
        selectedOptionText: selectedOpt?.option_text || selectedOptionId.charAt(0).toUpperCase() + selectedOptionId.slice(1),
        correctOptionText: correctOpt?.option_text || (correctOpt?.is_correct === true ? "True" : "False"),
      });
    }
    setIsFlipped(true);
  }, [quizData, isFlipped, quizCompleted]);
  
  const handleSubmitQuiz = useCallback(async () => {
    if (!quizData || !quizData.questions) return;
    setIsSubmitting(true); setQuizCompleted(true); 
    const submission = {
      quizId: quizData.id, userId, attemptId,
      answers: Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
    };
    try {
      const response = await fetch(`/api/quizzes/${quizData.id}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
        throw new Error(errData.error || 'Failed to submit quiz.');
      }
      const resultData = await response.json();
      setResults(resultData); 
      setIsFlipped(false); // Ensure card is not flipped when showing final results
      scrollToTop();
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setResults({ score: 0, totalQuestions: quizData.questions.length, pointsAwarded: 0 });
    } finally { setIsSubmitting(false); }
  }, [quizData, userId, attemptId, userAnswers, scrollToTop]); // Added missing dependency

  const proceedToNextQuestion = useCallback(() => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else { 
      handleSubmitQuiz(); // If it's the last question, "View Results" triggers submission
    }
    setIsFlipped(false); 
    setCurrentAnswerFeedback(null);
  }, [quizData, currentQuestionIndex, handleSubmitQuiz]); // Added handleSubmitQuiz dependency

  const goToNextQuestion = useCallback(() => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsFlipped(false); 
      setCurrentAnswerFeedback(null);
    }
  }, [quizData, currentQuestionIndex]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsFlipped(false);
      setCurrentAnswerFeedback(null);
    }
  }, [currentQuestionIndex]);


  if (isLoadingQuiz) return <div className="text-center p-8 animate-pulse">Loading quiz questions...</div>;
  if (quizFetchError) return <div className="text-center p-8 text-red-600">Error loading quiz: {quizFetchError}</div>;
  if (!quizData || quizData.questions.length === 0) return <div className="text-center p-8 text-gray-500">This quiz is currently unavailable or has no questions.</div>;
  
  if (isSubmitting && !results) return <div className="text-center p-8">Submitting and grading...</div>;

  if (quizCompleted && results) {
    return (
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl" ref={contentRef}>
        <h2 className="text-2xl font-bold mb-4 text-center text-brand-primary">Quiz Completed!</h2>
        <p className="text-xl text-center mb-2">Your Score: <span className="font-bold">{results.score}</span> / {results.totalQuestions}</p>
        <p className="text-lg text-center mb-6">Points Awarded: <span className="font-bold text-green-600">+{results.pointsAwarded}</span></p>
        <div className="my-6 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          <h3 className="text-lg font-semibold text-neutral-text">Review Your Answers:</h3>
          {quizData.questions.map((q, idx) => {
            const choiceInfo = results.userChoices?.[q.id];
            const selectedOption = q.options?.find(opt => opt.id === choiceInfo?.selected);
            let displaySelectedText = selectedOption?.option_text;
            if (q.question_type === 'true-false' && (choiceInfo?.selected === 'true' || choiceInfo?.selected === 'false')) {
                displaySelectedText = choiceInfo.selected.charAt(0).toUpperCase() + choiceInfo.selected.slice(1);
            }
            return (
              <div key={q.id} className={`p-3 rounded-md ${choiceInfo?.correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
                <p className="font-medium text-gray-800">{idx + 1}. {q.question_text}</p>
                <p className="text-sm text-gray-700">Your answer: <span className={choiceInfo?.correct ? "font-semibold text-green-700" : "font-semibold text-red-700"}>{displaySelectedText || (choiceInfo?.selected ? 'N/A' : 'Not answered')}</span></p>
                {!choiceInfo?.correct && choiceInfo?.selected && (<p className="text-sm text-green-600">Correct Answer: (Details can be enhanced)</p> )}
                {q.explanation && <p className="text-xs mt-1 italic text-gray-600">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8"><Button onClick={() => router.push('/quizzes')} variant="primary">Back to Quizzes</Button></div>
      </div>
    );
  }
  
  if (!currentQuestion) return <div className="text-center p-8">Preparing question...</div>;

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl flex flex-col min-h-[calc(100vh-200px)] md:min-h-[60vh]" ref={contentRef}>
      <div className="mb-4 text-sm text-gray-600 px-1">
        Question {currentQuestionIndex + 1} of {quizData.questions.length}
        {currentQuestion.points > 0 && ` (${currentQuestion.points} pts)`}
      </div>

      <div className="flashcard-container flex-grow">
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flashcard-face flashcard-front bg-white">
            <div className="flex flex-col h-full">
                <div className="flex-grow overflow-y-auto p-1"> {/* Add padding inside scroll area */}
                    <h2 className="text-xl font-semibold text-neutral-text mb-4 leading-tight">
                        {currentQuestion.question_text}
                    </h2>
                    {currentQuestion.question_type === 'multiple-choice' && currentQuestion.options.map((option) => (
                    <label key={option.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === option.id ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                        <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={userAnswers[currentQuestion.id] === option.id} onChange={() => handleOptionSelect(currentQuestion.id, option.id)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                        <span className="text-gray-700">{option.option_text}</span>
                    </label>
                    ))}
                    {currentQuestion.question_type === 'true-false' && (
                        (currentQuestion.options && currentQuestion.options.length >= 2 ? 
                            currentQuestion.options.map(option => (
                                <label key={option.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === option.id ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                                    <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={userAnswers[currentQuestion.id] === option.id} onChange={() => handleOptionSelect(currentQuestion.id, option.id)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                                    <span className="text-gray-700">{option.option_text}</span>
                                </label>
                            ))
                        : 
                            <>
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === 'true' ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                                    <input type="radio" name={`question-${currentQuestion.id}`} value="true" checked={userAnswers[currentQuestion.id] === 'true'} onChange={() => handleOptionSelect(currentQuestion.id, 'true')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                                    <span className="text-gray-700">True</span>
                                </label>
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === 'false' ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                                    <input type="radio" name={`question-${currentQuestion.id}`} value="false" checked={userAnswers[currentQuestion.id] === 'false'} onChange={() => handleOptionSelect(currentQuestion.id, 'false')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                                    <span className="text-gray-700">False</span>
                                </label>
                            </>
                    ))}
                </div>
             <div className="mt-auto pt-4"></div> {/* Spacer for flex-col layout */}
            </div>
          </div>

          <div className="flashcard-face flashcard-back bg-gray-50 items-center justify-center flex flex-col">
            {currentAnswerFeedback && (
              <div className="text-center p-4">
                {currentAnswerFeedback.isCorrect ? <CheckCircleIcon className="h-12 w-12 md:h-16 md:w-16 text-green-500 mx-auto mb-2 md:mb-3" /> : <XCircleIcon className="h-12 w-12 md:h-16 md:w-16 text-red-500 mx-auto mb-2 md:mb-3" />}
                <p className={`text-lg md:text-xl font-semibold ${currentAnswerFeedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{currentAnswerFeedback.isCorrect ? 'Correct!' : 'Not quite!'}</p>
                <p className="text-sm text-gray-600 mt-1">Your answer: {currentAnswerFeedback.selectedOptionText}</p>
                {!currentAnswerFeedback.isCorrect && currentAnswerFeedback.correctOptionText && (<p className="text-sm text-gray-600">Correct answer: {currentAnswerFeedback.correctOptionText}</p>)}
                {currentQuestion.explanation && (<p className="text-sm text-gray-700 mt-3 pt-3 border-t border-gray-200">{currentQuestion.explanation}</p>)}
              </div>
            )}
            <Button onClick={proceedToNextQuestion} variant="primary" className="mt-4 md:mt-6">
              {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish & View Results'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center">
        <Button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0 || quizCompleted || isFlipped} variant="outline">Previous</Button>
        {!isFlipped && (
            currentQuestionIndex < quizData.questions.length - 1 ? (
            <Button onClick={goToNextQuestion} disabled={quizCompleted || !currentQuestion || !userAnswers[currentQuestion.id]} variant="primary">Next Question</Button>
            ) : (
            <Button onClick={handleSubmitQuiz} disabled={quizCompleted || isSubmitting || !quizData || Object.keys(userAnswers).length !== quizData.questions.length} variant="primary" className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500">
              {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
            </Button>
            )
        )}
        {isFlipped && <div style={{ minWidth: '100px' }}>&nbsp;</div>}
      </div>
    </div>
  );
}