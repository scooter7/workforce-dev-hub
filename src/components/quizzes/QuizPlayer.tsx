'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizData, QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

// Helper function to convert various YouTube URLs to an embeddable format
function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId: string | null | undefined = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      if (urlObj.pathname === '/watch') videoId = urlObj.searchParams.get('v');
      else if (urlObj.pathname.startsWith('/embed/')) videoId = urlObj.pathname.substring('/embed/'.length).split('/')[0];
      else if (urlObj.pathname.startsWith('/live/')) videoId = urlObj.pathname.substring('/live/'.length).split('/')[0];
    } else if (urlObj.hostname === 'youtu.be') videoId = urlObj.pathname.substring(1).split('/')[0];
  } catch (e) { console.error("Error parsing video URL for YouTube:", e); return null; }
  if (videoId) {
    videoId = videoId.split('?')[0].split('&')[0]; // Clean extra params from ID
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Basic check if it's an embed URL from other platforms, or a direct video
  if (url.includes('/embed/') || url.match(/\.(mp4|webm|ogg)$/i)) {
    return url; // Assume it's a valid embed or direct video link
  }
  console.warn("Could not determine valid embed URL from:", url);
  return null;
}


interface QuizPlayerProps {
  quizId: string;
  userId: string;
  attemptId?: string;
}

type UserAnswers = Record<string, string>;

export default function QuizPlayer({ quizId, userId, attemptId }: QuizPlayerProps) {
  const router = useRouter();
  // ... (all existing state variables: quizData, isLoadingQuiz, etc. remain the same)
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizFetchError, setQuizFetchError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const initialUserAnswers: UserAnswers = {};
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(initialUserAnswers);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentAnswerFeedback, setCurrentAnswerFeedback] = useState<{
    isCorrect: boolean; selectedOptionText?: string; correctOptionText?: string;
  } | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number; totalQuestions: number; pointsAwarded: number;
    userChoices?: Record<string, { selected: string | null; correct: boolean; explanation?: string | null }>;
  } | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => { /* ... same ... */ 
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  useEffect(() => { /* ... same fetchQuizInternal logic ... */ 
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
        setQuizFetchError(error.message || "An unexpected error occurred while loading the quiz.");
      } finally { setIsLoadingQuiz(false); }
    }
    fetchQuizInternal();
  }, [quizId]);

  useEffect(() => { /* ... same scroll to top ... */ 
    if (!isFlipped && !isLoadingQuiz && quizData) scrollToTop();
  }, [currentQuestionIndex, isFlipped, isLoadingQuiz, quizData, scrollToTop]);

  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  const handleOptionSelect = useCallback((questionId: string, selectedOptionId: string) => { /* ... same ... */ 
    if (isFlipped || quizCompleted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: selectedOptionId }));
    const question = quizData?.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const selectedOpt = question.options.find(opt => opt.id === selectedOptionId || opt.option_text.toLowerCase() === selectedOptionId.toLowerCase());
      const correctOpt = question.options.find(opt => opt.is_correct);
      setCurrentAnswerFeedback({
        isCorrect: selectedOpt?.is_correct || false,
        selectedOptionText: selectedOpt?.option_text || (selectedOptionId === 'true' || selectedOptionId === 'false' ? selectedOptionId.charAt(0).toUpperCase() + selectedOptionId.slice(1) : selectedOptionId),
        correctOptionText: correctOpt?.option_text,
      });
    }
    setIsFlipped(true);
  }, [quizData, isFlipped, quizCompleted]);
  
  const handleSubmitQuiz = useCallback(async () => { /* ... same ... */ 
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
      setIsFlipped(false); 
      scrollToTop();
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setResults({ score: 0, totalQuestions: quizData.questions.length, pointsAwarded: 0 });
    } finally { setIsSubmitting(false); }
  }, [quizData, userId, attemptId, userAnswers, scrollToTop]);

  const proceedToNextQuestion = useCallback(() => { /* ... same ... */ 
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else { 
      handleSubmitQuiz();
    }
    setIsFlipped(false); 
    setCurrentAnswerFeedback(null);
  }, [quizData, currentQuestionIndex, handleSubmitQuiz]);

  const goToNextQuestion = useCallback(() => { /* ... same ... */ 
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsFlipped(false); 
      setCurrentAnswerFeedback(null);
    }
  }, [quizData, currentQuestionIndex]);

  const goToPreviousQuestion = useCallback(() => { /* ... same ... */ 
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsFlipped(false);
      setCurrentAnswerFeedback(null);
    }
  }, [currentQuestionIndex]);

  // --- RENDER LOGIC ---
  if (isLoadingQuiz) return <div className="text-center p-8 animate-pulse">Loading quiz...</div>;
  if (quizFetchError) return <div className="text-center p-8 text-red-600">Error loading quiz: {quizFetchError}</div>;
  if (!quizData || quizData.questions.length === 0) return <div className="text-center p-8 text-gray-500">Quiz unavailable.</div>;
  
  if (isSubmitting && !results) return <div className="text-center p-8">Submitting...</div>;
  if (quizCompleted && results) { /* ... Results JSX (same as before) ... */ 
    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl" ref={mainContentRef}>
            {/* ... same results display structure ... */}
            <h2 className="text-2xl font-bold mb-4 text-center text-brand-primary">Quiz Completed!</h2>
            <p className="text-xl text-center mb-2">Your Score: <span className="font-bold">{results.score}</span> / {results.totalQuestions}</p>
            <p className="text-lg text-center mb-6">Points Awarded: <span className="font-bold text-green-600">+{results.pointsAwarded}</span></p>
            <div className="my-6 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold text-neutral-text">Review Your Answers:</h3>
                {quizData.questions.map((q, idx) => { /* ... same ... */ })}
            </div>
            <div className="text-center mt-8"><Button onClick={() => router.push('/quizzes')} variant="primary">Back to Quizzes</Button></div>
        </div>
    );
  }
  
  if (!currentQuestion) return <div className="text-center p-8">Preparing question...</div>;

  // Media Rendering Component
  const QuestionMedia = ({ question }: { question: QuizQuestion }) => {
    if (question.video_url) {
      const embedUrl = getYoutubeEmbedUrl(question.video_url);
      if (embedUrl) {
        return (
          <div className="aspect-video w-full max-w-lg mx-auto my-4 rounded-lg overflow-hidden shadow">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title="Quiz Video Content"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
    } else if (question.image_url) {
      return (
        <div className="my-4 flex justify-center">
          <img src={question.image_url} alt="Question-related image" className="max-w-full h-auto max-h-72 rounded-md shadow" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full" ref={mainContentRef}>
      <div className="mb-4 text-sm text-gray-600 px-1 flex-shrink-0">
        Question {currentQuestionIndex + 1} of {quizData.questions.length}
        {currentQuestion.points > 0 && ` (${currentQuestion.points} pts)`}
      </div>

      <div className="flashcard-container flex-grow">
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
          {/* Front of the Card: Question & Options */}
          <div className="flashcard-face flashcard-front bg-white">
            {currentQuestion.media_position === 'above_text' && <QuestionMedia question={currentQuestion} />}
            <h2 className="text-xl font-semibold text-neutral-text mb-4 leading-tight flex-shrink-0 px-1">
                {currentQuestion.question_text}
            </h2>
            <div className="flashcard-content-scrollable px-1"> 
                {currentQuestion.question_type === 'multiple-choice' && currentQuestion.options.map((option) => (
                <label key={option.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === option.id ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={userAnswers[currentQuestion.id] === option.id} onChange={() => handleOptionSelect(currentQuestion.id, option.id)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                    <span className="text-gray-700">{option.option_text}</span>
                </label>
                ))}
                {currentQuestion.question_type === 'true-false' && ( /* ... True/False options rendering ... */
                    (currentQuestion.options && currentQuestion.options.length >= 2 ? 
                        currentQuestion.options.map(option => (
                            <label key={option.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === option.id ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={userAnswers[currentQuestion.id] === option.id} onChange={() => handleOptionSelect(currentQuestion.id, option.id)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                                <span className="text-gray-700">{option.option_text}</span>
                            </label>
                        ))
                    : 
                        <>
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === 'true' ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                <input type="radio" name={`question-${currentQuestion.id}`} value="true" checked={userAnswers[currentQuestion.id] === 'true'} onChange={() => handleOptionSelect(currentQuestion.id, 'true')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                                <span className="text-gray-700">True</span>
                            </label>
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === 'false' ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                <input type="radio" name={`question-${currentQuestion.id}`} value="false" checked={userAnswers[currentQuestion.id] === 'false'} onChange={() => handleOptionSelect(currentQuestion.id, 'false')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                                <span className="text-gray-700">False</span>
                            </label>
                        </>
                ))}
            </div>
            {currentQuestion.media_position === 'below_text' && <QuestionMedia question={currentQuestion} />}
          </div>

          {/* Back of the Card: Answer Feedback */}
          <div className="flashcard-face flashcard-back bg-gray-50">
            {currentAnswerFeedback && ( /* ... Feedback JSX ... */
                 <div className="text-center w-full p-2">
                    {currentAnswerFeedback.isCorrect ? <CheckCircleIcon className="h-12 w-12 md:h-16 md:w-16 text-green-500 mx-auto mb-2 md:mb-3" /> : <XCircleIcon className="h-12 w-12 md:h-16 md:w-16 text-red-500 mx-auto mb-2 md:mb-3" />}
                    <p className={`text-lg md:text-xl font-semibold ${currentAnswerFeedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{currentAnswerFeedback.isCorrect ? 'Correct!' : 'Not quite!'}</p>
                    <p className="text-sm text-gray-600 mt-1">Your answer: {currentAnswerFeedback.selectedOptionText}</p>
                    {!currentAnswerFeedback.isCorrect && currentAnswerFeedback.correctOptionText && (<p className="text-sm text-gray-600">Correct answer: {currentAnswerFeedback.correctOptionText}</p>)}
                    {currentQuestion.explanation && (<div className="text-sm text-gray-700 mt-3 pt-3 border-t border-gray-200 max-h-32 overflow-y-auto">{currentQuestion.explanation}</div>)}
                </div>
            )}
            <Button onClick={proceedToNextQuestion} variant="primary" className="mt-4 md:mt-6">
              {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish & View Results'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation buttons */}
      <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
         {/* ... Navigation buttons JSX (same as before) ... */}
        <Button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0 || quizCompleted || isFlipped} variant="outline">Previous</Button>
        {!isFlipped && (
            currentQuestionIndex < quizData.questions.length - 1 ? (
            <Button onClick={goToNextQuestion} disabled={quizCompleted || !currentQuestion || !userAnswers[currentQuestion.id]} variant="primary">Next Question</Button>
            ) : (
            <Button onClick={handleSubmitQuiz} disabled={quizCompleted || isSubmitting || !quizData || !currentQuestion || Object.keys(userAnswers).length !== quizData.questions.length} variant="primary" className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500">
              {isSubmitting ? 'Submitting...' : 'Finish Quiz'}
            </Button>
            )
        )}
        {isFlipped && <div className="w-[88px] h-[38px]">&nbsp;</div>}
      </div>
    </div>
  );
}