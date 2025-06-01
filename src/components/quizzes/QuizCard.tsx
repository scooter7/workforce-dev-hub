// src/components/quizzes/QuizCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image'; // For optimized images if using card_image_url
import { QuizTeaser } from '@/types/quiz';
import { PuzzlePieceIcon, ChevronRightIcon } from '@heroicons/react/24/solid'; // Or other suitable icons

interface QuizCardProps {
  quiz: QuizTeaser;
  topicColor?: string; // Pass the color of the parent topic
}

export default function QuizCard({ quiz, topicColor }: QuizCardProps) {
  const fallbackColor = topicColor || '#4B5563'; // Default to a neutral gray if no topic color
  const hasImage = quiz.card_image_url;

  return (
    <Link href={`/quizzes/${quiz.id}`} legacyBehavior>
      <a className={`group relative flex flex-col justify-between rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden aspect-[2/3] md:aspect-[3/4] transform hover:-translate-y-1 hover:scale-[1.03]`}
         style={!hasImage ? { backgroundColor: fallbackColor } : {}}>
        
        {hasImage && (
          <Image
            src={quiz.card_image_url!}
            alt={`${quiz.title} background`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-110"
          />
        )}

        {/* Gradient overlay for text readability if there's an image */}
        {hasImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
        )}

        {/* Content Overlay - positioned relative to allow absolute positioning of text from bottom */}
        <div className={`relative flex flex-col justify-end h-full p-4 ${hasImage ? 'text-white' : ''}`}>
          <div> {/* This div ensures content is pushed to the bottom by justify-end on parent */}
            <div className="flex items-center mb-2">
              <PuzzlePieceIcon className={`h-6 w-6 mr-2 flex-shrink-0 ${hasImage ? 'text-white/90' : 'text-white/70 group-hover:text-white'}`} />
              <h3 className={`text-lg font-semibold ${hasImage ? '' : 'group-hover:text-white'} line-clamp-2`} title={quiz.title}>
                {quiz.title}
              </h3>
            </div>
            {quiz.description && !hasImage && ( // Show description only if no image, or style it carefully over image
              <p className={`text-xs ${hasImage ? 'text-gray-200' : 'text-white/70 group-hover:text-white/90'} mb-2 line-clamp-3`}>
                {quiz.description}
              </p>
            )}
          </div>
          <div className={`mt-auto flex justify-between items-center text-xs pt-2 ${hasImage ? 'text-gray-300 border-t border-white/20' : 'text-white/60 group-hover:text-white/80 border-t border-white/10'}`}>
            <span className="capitalize">{quiz.difficulty || 'General'} | {quiz.question_count || 0} Qs</span>
            <span className={`inline-flex items-center font-medium ${hasImage ? 'text-white group-hover:text-gray-100' : 'group-hover:text-white'}`}>
              Start <ChevronRightIcon className="h-4 w-4 ml-1" />
            </span>
          </div>
        </div>
      </a>
    </Link>
  );
}