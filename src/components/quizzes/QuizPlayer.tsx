'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizQuestion, QuestionOption } from '@/types/quiz';
import Button from '@/components/ui/Button';

interface QuizPlayerProps {
  quizId: string;
  questions: QuizQuestion[];
  title: string;
}

// A helper to safely render embedded YouTube URLs
const getYouTubeEmbedUrl = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
    }
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
    }
    // Return null if it's not a recognizable YouTube URL
    return null;
  } catch (error) {
    return null; // Invalid URL
  }
};

export default function QuizPlayer({ quizId, questions, title }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const router = useRouter();

  const currentQuestion = questions[currentQuestionIndex];
  const embedUrl = getYouTubeEmbedUrl(currentQuestion?.video_url);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    // Logic to calculate score
    let finalScore = 0;
    questions.forEach(q => {
        const correctOption = q.options.find(opt => opt.is_correct);
        if (correctOption && selectedOptions[q.id] === correctOption.id) {
            finalScore += q.points;
        }
    });
    setScore(finalScore);
    setIsFinished(true);

    // Here you would typically submit the results to your backend
    try {
        await fetch(`/api/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: selectedOptions }),
        });
    } catch (error) {
        console.error("Failed to submit quiz results", error);
    }
  };

  if (isFinished) {
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold">Quiz Finished!</h2>
            <p className="mt-4 text-lg">Your score: {score} / {questions.reduce((acc, q) => acc + q.points, 0)}</p>
            <Button onClick={() => router.push('/quizzes')} className="mt-6">Back to Quizzes</Button>
        </div>
    )
  }

  if (!currentQuestion) {
    return <div>This quiz has no questions.</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">{title}</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Question {currentQuestionIndex + 1} of {questions.length} ({currentQuestion.points} pts)
        </p>
        
        {/* Corrected Layout: Use flex-col and remove fixed height constraints */}
        <div className="mt-4 flex flex-col">
            {embedUrl && (
                <div className="w-full aspect-video mb-4">
                    <iframe
                        key={embedUrl} // Add key to force re-render on change
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            )}
            
            {currentQuestion.image_url && (
                <div className="w-full mb-4">
                    <img src={currentQuestion.image_url} alt="Question media" className="rounded-lg max-w-full h-auto mx-auto" />
                </div>
            )}

            <p className="text-lg font-medium my-4">{currentQuestion.question_text}</p>
            
            {/* Options Area */}
            <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                    <label
                        key={option.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedOptions[currentQuestion.id] === option.id ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            checked={selectedOptions[currentQuestion.id] === option.id}
                            onChange={() => handleOptionSelect(currentQuestion.id, option.id)}
                            className="mr-4"
                        />
                        <span>{option.option_text}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
            <Button onClick={goToPrevious} disabled={currentQuestionIndex === 0}>
                Previous
            </Button>
            {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={goToNext}>
                    Next
                </Button>
            ) : (
                <Button onClick={handleSubmit} disabled={!selectedOptions[currentQuestion.id]}>
                    Finish Quiz
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
