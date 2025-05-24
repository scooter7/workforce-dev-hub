'use client';

import { useState, useEffect, useRef } from 'react';
import { QuizData, QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'; // For correctness indication

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
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isFlipped, setIsFlipped] = useState(false); // For flashcard flip state
  const [currentAnswerFeedback, setCurrentAnswerFeedback] = useState<{
    isCorrect: boolean;
    selectedOptionText?: string;
    correctOptionText?: string;
  } | null>(null);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    pointsAwarded: number;
    userChoices?: Record<string, { selected: string | null; correct: boolean; explanation?: string | null }>;
  } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch Quiz Data
  useEffect(() => {
    // ... (fetchQuiz logic remains the same) ...
    if (!quizId) {
      setQuizFetchError("Quiz ID is missing.");
      setIsLoadingQuiz(false);
      return;
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
      } finally {
        setIsLoadingQuiz(false);
      }
    }
    fetchQuizInternal();
  }, [quizId]);

  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  const handleOptionSelect = (questionId: string, selectedOptionId: string) => {
    if (isFlipped || quizCompleted) return; // Don't allow changes if already flipped or quiz completed

    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: selectedOptionId,
    }));

    // Determine correctness for immediate feedback
    const question = quizData?.questions.find(q => q.id === questionId);
    if (question && question.question_type === 'multiple-choice') {
      const selectedOpt = question.options.find(opt => opt.id === selectedOptionId);
      const correctOpt = question.options.find(opt => opt.is_correct);
      setCurrentAnswerFeedback({
        isCorrect: selectedOpt?.is_correct || false,
        selectedOptionText: selectedOpt?.option_text,
        correctOptionText: correctOpt?.option_text,
      });
    } else if (question && question.question_type === 'true-false') {
        // Assuming T/F questions have 'true' or 'false' as correct answer stored somewhere
        // For this example, let's assume the 'explanation' field might hint or options for T/F are simple
        // This part needs proper data for T/F correct answers if fetched
        const isCorrectTF = (question.options.find(opt => opt.option_text.toLowerCase() === selectedOptionId.toLowerCase() && opt.is_correct));
        setCurrentAnswerFeedback({
            isCorrect: !!isCorrectTF,
            selectedOptionText: selectedOptionId,
            correctOptionText: question.options.find(opt => opt.is_correct)?.option_text
        });
    }
    setIsFlipped(true); // Flip the card
  };

  const proceedToNextQuestion = () => {
    setIsFlipped(false); // Unflip card
    setCurrentAnswerFeedback(null);
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // If it's the last question and they click "Next" after seeing feedback,
      // it could mean they are ready to submit or see summary.
      // For now, we just enable the Finish Quiz button.
      // If not all questions answered, we shouldn't auto-submit.
    }
  };

  const handleSubmitQuiz = async () => {
    // ... (handleSubmitQuiz logic remains the same, eventually calls setResults) ...
    if (!quizData || !quizData.questions) return;
    setIsSubmitting(true); setQuizCompleted(true);
    const submission = { /* ... */ };
    try {
      const response = await fetch(`/api/quizzes/${quizData.id}/submit`, { /* ... */ });
      if (!response.ok) { /* ... */ throw new Error('Failed to submit'); }
      const resultData = await response.json();
      setResults(resultData);
    } catch (error: any) { /* ... */ }
    finally { setIsSubmitting(false); }
  };

  // --- Render Logic ---
  if (isLoadingQuiz) return <div className="text-center p-8 animate-pulse">Loading quiz...</div>;
  if (quizFetchError) return <div className="text-center p-8 text-red-600">Error: {quizFetchError}</div>;
  if (!quizData || quizData.questions.length === 0) return <div className="text-center p-8">Quiz unavailable.</div>;

  if (quizCompleted && results) { /* ... Results display remains the same ... */
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center text-brand-primary">Quiz Completed!</h2>
        <p className="text-xl text-center mb-2">Your Score: <span className="font-bold">{results.score}</span> / {results.totalQuestions}</p>
        <p className="text-lg text-center mb-6">Points Awarded: <span className="font-bold text-green-600">+{results.pointsAwarded}</span></p>
        <div className="my-6 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          <h3 className="text-lg font-semibold text-neutral-text">Review Your Answers:</h3>
          {quizData.questions.map((q, idx) => { /* ... same review logic ... */
            const choiceInfo = results.userChoices?.[q.id];
            const selectedOption = q.options.find(opt => opt.id === choiceInfo?.selected);
            const selectedOptionText = selectedOption?.option_text || (choiceInfo?.selected === 'true' || choiceInfo?.selected === 'false' ? choiceInfo.selected : undefined);
            
            return (
              <div key={q.id} className={`p-3 rounded-md ${choiceInfo?.correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
                <p className="font-medium text-gray-800">{idx + 1}. {q.question_text}</p>
                <p className="text-sm text-gray-700">Your answer: <span className={choiceInfo?.correct ? "font-semibold text-green-700" : "font-semibold text-red-700"}>{selectedOptionText || (choiceInfo?.selected ? 'N/A - Invalid Option' : 'Not answered')}</span></p>
                {!choiceInfo?.correct && choiceInfo?.selected && (
                   <p className="text-sm text-green-600">Correct Answer: (Details from server/explanation)</p>
                )}
                {q.explanation && <p className="text-xs mt-1 italic text-gray-600">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8"><Button onClick={() => router.push('/quizzes')} variant="primary">Back to Quizzes</Button></div>
      </div>
    );
  }
  
  if (!currentQuestion) return <div className="text-center p-8">Loading question...</div>;

  return (
    <div className="p-4 md:p-6 flex flex-col h-full" ref={contentRef}>
      <div className="mb-4 text-sm text-gray-600">
        Question {currentQuestionIndex + 1} of {quizData.questions.length}
        {currentQuestion.points > 0 && ` (${currentQuestion.points} pts)`}
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
          {/* Front of the Card (Question) */}
          <div className="flashcard-face flashcard-front p-6 bg-white">
            <h2 className="text-xl font-semibold text-neutral-text mb-4 leading-tight">
              {currentQuestion.question_text}
            </h2>
            {currentQuestion.question_type === 'multiple-choice' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
                      ${ userAnswers[currentQuestion.id] === option.id
                          ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' // Lighter selection before flip
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={userAnswers[currentQuestion.id] === option.id}
                      onChange={() => handleOptionSelect(currentQuestion.id, option.id)}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3"
                    />
                    <span>{option.option_text}</span>
                  </label>
                ))}
              </div>
            )}
            {currentQuestion.question_type === 'true-false' && (
             <div className="space-y-3">
                {/* Simplified T/F options - assuming options array has 'True' and 'False' with their IDs */}
                {currentQuestion.options.map(option => (
                    <label key={option.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${userAnswers[currentQuestion.id] === option.id ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                        <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={userAnswers[currentQuestion.id] === option.id} onChange={() => handleOptionSelect(currentQuestion.id, option.id)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3"/>
                        <span>{option.option_text}</span>
                    </label>
                ))}
             </div>
            )}
          </div>

          {/* Back of the Card (Answer Feedback) */}
          <div className="flashcard-face flashcard-back p-6">
            {currentAnswerFeedback && (
              <div className="text-center">
                {currentAnswerFeedback.isCorrect ? (
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-3" />
                ) : (
                  <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-3" />
                )}
                <p className={`text-xl font-semibold ${currentAnswerFeedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {currentAnswerFeedback.isCorrect ? 'Correct!' : 'Not quite!'}
                </p>
                <p className="text-sm text-gray-600 mt-1">Your answer: {currentAnswerFeedback.selectedOptionText || 'Not answered'}</p>
                {!currentAnswerFeedback.isCorrect && currentAnswerFeedback.correctOptionText && (
                  <p className="text-sm text-gray-600">Correct answer: {currentAnswerFeedback.correctOptionText}</p>
                )}
                {currentQuestion.explanation && (
                  <p className="text-sm text-gray-700 mt-3 pt-3 border-t">{currentQuestion.explanation}</p>
                )}
              </div>
            )}
            <Button onClick={proceedToNextQuestion} variant="primary" className="mt-6">
              {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'View Results'}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons (only Previous and Finish are needed if Next is on back of card) */}
      {/* OR keep them here and make the "Next Question" on back of card just unflip */}
      <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center">
        <Button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0 || quizCompleted || isFlipped}
          variant="outline"
        >
          Previous
        </Button>
        {/* "Next Question" or "Finish Quiz" button logic needs to consider the flipped state */}
        {/* If card is flipped, the main "Next/Finish" is on the back of the card */}
        {!isFlipped && currentQuestionIndex < quizData.questions.length - 1 && (
          <Button
            onClick={goToNextQuestion} // This directly moves, no flip involved unless handleOptionSelect was called
            disabled={quizCompleted || !userAnswers[currentQuestion.id]}
            variant="primary"
          >
            Next Question
          </Button>
        )}
        {!isFlipped && currentQuestionIndex === quizData.questions.length - 1 && (
          <Button
            onClick={handleSubmitQuiz}
            disabled={quizCompleted || isSubmitting || Object.keys(userAnswers).length !== quizData.questions.length}
            variant="primary"
            className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500"
          >
            {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
}