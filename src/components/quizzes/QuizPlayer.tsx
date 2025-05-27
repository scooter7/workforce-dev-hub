'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizData, QuizQuestion } from '@/types/quiz'; // Assuming MediaPosition is also in here if used
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

// --- Corrected and Enhanced YouTube URL Helper ---
function getYoutubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  console.log("[getYoutubeEmbedUrl] Original video URL to parse:", url);
  let videoId: string | null | undefined = null;

  try {
    // Try parsing as a full URL object first
    // Ensure URL has a protocol for the URL constructor
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const urlObj = new URL(fullUrl);

    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.substring('/embed/'.length).split('/')[0];
      } else if (urlObj.pathname.startsWith('/live/')) {
        videoId = urlObj.pathname.substring('/live/'.length).split('/')[0];
      }
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.substring(1).split('/')[0];
    }
  } catch (e) {
    console.warn("[getYoutubeEmbedUrl] Could not parse URL with 'new URL()', trying regex. URL:", url, "Error:", e);
  }

  // Fallback regex if URL object parsing failed or didn't find ID for common patterns
  if (!videoId) {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        videoId = match[1];
        console.log("[getYoutubeEmbedUrl] Extracted videoId via regex:", videoId);
    }
  }
  
  if (videoId) {
    videoId = videoId.split('?')[0].split('&')[0]; // Clean extra params from ID
    const embedLink = `https://m.youtube.com/watch?v=kkFAu_ve5Q0{videoId}`; // Correct YouTube embed base URL
    console.log("[getYoutubeEmbedUrl] Generated YouTube embed URL:", embedLink);
    return embedLink;
  }
  
  // Basic check for other direct video files or general /embed/ links
  if (url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/embed/')) {
    console.log("[getYoutubeEmbedUrl] Returning URL as is (assumed direct video or other platform embed):", url);
    return url; 
  }

  console.warn("[getYoutubeEmbedUrl] Could not determine valid embed URL from:", url);
  return null;
}
// --- End Helper ---


interface QuizPlayerProps {
  quizId: string;
  userId: string;
  attemptId?: string;
}

type UserAnswers = Record<string, string>; // { questionId: selectedOptionId }

export default function QuizPlayer({ quizId, userId, attemptId }: QuizPlayerProps) {
  const router = useRouter();
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

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!quizId) { 
      setQuizFetchError("Quiz ID is missing."); setIsLoadingQuiz(false); return;
    }
    console.log(`QuizPlayer: useEffect for quizId ${quizId} triggered. Resetting state.`);
    setIsLoadingQuiz(true); setQuizFetchError(null); setQuizData(null);
    setCurrentQuestionIndex(0); setUserAnswers({}); setQuizCompleted(false);
    setResults(null); setIsFlipped(false); setCurrentAnswerFeedback(null); setIsSubmitting(false);

    async function fetchQuizInternal() {
      console.log(`QuizPlayer: Fetching questions for quizId: ${quizId}`);
      try {
        const response = await fetch(`/api/quizzes/${quizId}/questions`);
        console.log(`QuizPlayer: API response status for /api/quizzes/${quizId}/questions: ${response.status}`);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ error: "Failed to parse error response as JSON" }));
            throw new Error(errData.error || `Failed to load quiz (Status: ${response.status})`);
        }
        const data: QuizData = await response.json();
        console.log("QuizPlayer: Received quizData from API:", JSON.stringify(data, null, 2));
        if (!data || !data.questions || !Array.isArray(data.questions)) {
            throw new Error("Quiz data or questions array missing/invalid in API response.");
        }
        setQuizData(data);
      } catch (error: any) {
        console.error("QuizPlayer: Failed to load quiz data:", error);
        setQuizFetchError(error.message || "An unexpected error occurred while loading the quiz.");
      } finally { setIsLoadingQuiz(false); }
    }
    fetchQuizInternal();
  }, [quizId]);

  useEffect(() => {
    if (!isFlipped && !isLoadingQuiz && quizData) {
        // console.log("QuizPlayer: Scrolling to top for new question/unflip.");
        scrollToTop();
    }
  }, [currentQuestionIndex, isFlipped, isLoadingQuiz, quizData, scrollToTop]);

  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion) {
      console.log("QuizPlayer - Current Question for Render:", JSON.stringify(currentQuestion, null, 2));
    } else if (quizData && quizData.questions.length > 0) {
      console.warn("QuizPlayer - currentQuestion is undefined, but quizData.questions exists. Index:", currentQuestionIndex);
    }
  }, [currentQuestion, quizData, currentQuestionIndex]);


  const handleOptionSelect = useCallback((questionId: string, selectedOptionId: string) => {
    // ... (same logic) ...
  }, [quizData, isFlipped, quizCompleted]);
  
  const handleSubmitQuiz = useCallback(async () => {
    // ... (same logic) ...
  }, [quizData, userId, attemptId, userAnswers, scrollToTop]);

  const proceedToNextQuestion = useCallback(() => {
    // ... (same logic) ...
  }, [quizData, currentQuestionIndex, handleSubmitQuiz]);

  const goToNextQuestion = useCallback(() => {
    // ... (same logic) ...
  }, [quizData, currentQuestionIndex]);

  const goToPreviousQuestion = useCallback(() => {
    // ... (same logic) ...
  }, [currentQuestionIndex]);


  if (isLoadingQuiz) return <div className="text-center p-8 animate-pulse">Loading quiz...</div>;
  if (quizFetchError) return <div className="text-center p-8 text-red-600">Error loading quiz: {quizFetchError}</div>;
  if (!quizData || !quizData.questions || quizData.questions.length === 0) { // Added check for empty questions array
    return <div className="text-center p-8 text-gray-500">Quiz unavailable or has no questions.</div>;
  }
  
  if (isSubmitting && !results) return <div className="text-center p-8">Submitting...</div>;

  if (quizCompleted && results) { 
    // ... Results JSX (same as before, ensure it's complete) ...
    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl" ref={mainContentRef}>
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

  // Media Rendering Component
  const QuestionMedia = ({ question }: { question: QuizQuestion }) => {
    // console.log("QuestionMedia received question:", JSON.stringify(question, null, 2));
    if (question.video_url) {
      const embedUrl = getYoutubeEmbedUrl(question.video_url);
      // console.log("QuestionMedia generated embedUrl:", embedUrl);
      if (embedUrl) {
        return (
          <div className="aspect-video w-full max-w-xl mx-auto my-4 rounded-lg overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={question.question_text || "Quiz Video Content"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        );
      } else {
         console.log("QuestionMedia: No embedUrl generated for video_url:", question.video_url);
      }
    } else if (question.image_url) {
      // console.log("QuestionMedia rendering image:", question.image_url);
      return (
        <div className="my-4 flex justify-center">
          <img src={question.image_url} alt={question.question_text || "Question image"} className="max-w-full h-auto max-h-80 rounded-md shadow-lg" />
        </div>
      );
    }
    // console.log("QuestionMedia: No video_url or image_url found.");
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
          <div className="flashcard-face flashcard-front bg-white">
            {currentQuestion.media_position === 'above_text' && <QuestionMedia question={currentQuestion} />}
            <h2 className="text-xl font-semibold text-neutral-text mb-4 leading-tight flex-shrink-0 px-1">
                {currentQuestion.question_text}
            </h2>
            <div className="flashcard-content-scrollable px-1"> 
                {/* ... Options rendering JSX (same as before) ... */}
            </div>
            {currentQuestion.media_position === 'below_text' && <QuestionMedia question={currentQuestion} />}
          </div>
          <div className="flashcard-face flashcard-back bg-gray-50">
            {/* ... Feedback JSX (same as before) ... */}
            <Button onClick={proceedToNextQuestion} variant="primary" className="mt-4 md:mt-6">
              {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish & View Results'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
        {/* ... Navigation buttons JSX (same as before) ... */}
      </div>
    </div>
  );
}