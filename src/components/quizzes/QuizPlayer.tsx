'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizData, QuizQuestion } from '@/types/quiz'; // MediaPosition is not directly used here
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

// --- Enhanced YouTube URL Helper ---
function getYoutubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  console.log("Original video URL to parse:", url);
  let videoId: string | null | undefined = null;

  try {
    // Try parsing as a full URL object first
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`); // Ensure it's a full URL
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.substring('/embed/'.length).split('/')[0];
      } else if (urlObj.pathname.startsWith('/live/')) {
        videoId = urlObj.pathname.substring('/live/'.length).split('/')[0];
      }
    } else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1).split('/')[0];
    }
  } catch (e) {
    // If new URL() fails (e.g. not a full URL), try regex as a fallback
    console.warn("Could not parse URL with 'new URL()', trying regex. Error:", e);
  }

  // Fallback regex if URL object parsing failed or didn't find ID
  if (!videoId) {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        videoId = match[1];
    }
  }
  
  if (videoId) {
    videoId = videoId.split('?')[0].split('&')[0]; // Clean extra params from ID
    const embedLink = `https://www.youtube.com/embed/${videoId}`;
    console.log("Generated YouTube embed URL:", embedLink);
    return embedLink;
  }
  
  // Check for common direct video file extensions or other general embed patterns
  if (url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/embed/')) { // Added general /embed/ check
    console.log("Returning URL as is (assumed direct video or other platform embed):", url);
    return url; 
  }

  console.warn("Could not determine valid embed URL from:", url);
  return null;
}
// --- End Helper ---

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
  const initialUserAnswers: UserAnswers = {};
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(initialUserAnswers);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentAnswerFeedback, setCurrentAnswerFeedback] = useState<{
    isCorrect: boolean; selectedOptionText?: string; correctOptionText?: string;
  } | null>(null);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState</* ... results type ... */> (null);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => { /* ... same ... */ }, []);
  useEffect(() => { /* ... same fetchQuizInternal logic ... */ }, [quizId]);
  useEffect(() => { /* ... same scroll to top effect ... */ }, [currentQuestionIndex, isFlipped, isLoadingQuiz, quizData, scrollToTop]);

  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentQuestionIndex];

  // --- ADD CONSOLE LOG FOR CURRENT QUESTION ---
  useEffect(() => {
    if (currentQuestion) {
      console.log("QuizPlayer - Current Question for Render:", JSON.stringify(currentQuestion, null, 2));
    }
  }, [currentQuestion]);
  // --- END CONSOLE LOG ---

  const handleOptionSelect = useCallback((questionId: string, selectedOptionId: string) => { /* ... same ... */ }, [quizData, isFlipped, quizCompleted]);
  const handleSubmitQuiz = useCallback(async () => { /* ... same ... */ }, [quizData, userId, attemptId, userAnswers, scrollToTop]);
  const proceedToNextQuestion = useCallback(() => { /* ... same ... */ }, [quizData, currentQuestionIndex, handleSubmitQuiz]);
  const goToNextQuestion = useCallback(() => { /* ... same ... */ }, [quizData, currentQuestionIndex]);
  const goToPreviousQuestion = useCallback(() => { /* ... same ... */ }, [currentQuestionIndex]);

  if (isLoadingQuiz) return <div className="text-center p-8 animate-pulse">Loading quiz...</div>;
  if (quizFetchError) return <div className="text-center p-8 text-red-600">Error: {quizFetchError}</div>;
  if (!quizData || quizData.questions.length === 0) return <div className="text-center p-8 text-gray-500">Quiz unavailable.</div>;
  
  if (isSubmitting && !results) return <div className="text-center p-8">Submitting...</div>;
  if (quizCompleted && results) { /* ... Results JSX remains the same ... */ }
  if (!currentQuestion) return <div className="text-center p-8">Preparing question...</div>;

  const QuestionMedia = ({ question }: { question: QuizQuestion }) => {
    console.log("QuestionMedia received question:", JSON.stringify(question, null, 2)); // Log input to QuestionMedia
    if (question.video_url) {
      const embedUrl = getYoutubeEmbedUrl(question.video_url);
      console.log("QuestionMedia generated embedUrl:", embedUrl); // Log generated URL
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
      console.log("QuestionMedia rendering image:", question.image_url);
      return (
        <div className="my-4 flex justify-center">
          <img src={question.image_url} alt={question.question_text || "Question image"} className="max-w-full h-auto max-h-80 rounded-md shadow-lg" />
        </div>
      );
    }
    console.log("QuestionMedia: No video_url or image_url found.");
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
            {/* Media Position: Above Text */}
            {(currentQuestion.media_position === 'above_text' || (!currentQuestion.media_position && (currentQuestion.image_url || currentQuestion.video_url))) && 
              <QuestionMedia question={currentQuestion} />
            }
            <h2 className="text-xl font-semibold text-neutral-text mb-4 leading-tight flex-shrink-0 px-1">
                {currentQuestion.question_text}
            </h2>
            <div className="flashcard-content-scrollable px-1"> 
                {/* Options rendering logic (same as before) ... */}
                {currentQuestion.question_type === 'multiple-choice' && currentQuestion.options.map((option) => (
                    <label key={option.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all mb-3 ${userAnswers[currentQuestion.id] === option.id ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                        <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={userAnswers[currentQuestion.id] === option.id} onChange={() => handleOptionSelect(currentQuestion.id, option.id)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 mr-3" disabled={isFlipped}/>
                        <span className="text-gray-700">{option.option_text}</span>
                    </label>
                ))}
                {currentQuestion.question_type === 'true-false' && ( /* ... True/False options rendering ... */ )}
            </div>
            {/* Media Position: Below Text */}
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