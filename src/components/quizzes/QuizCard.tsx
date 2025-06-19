// src/components/quizzes/QuizCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { QuizTeaser } from '@/types/quiz';
import {
  PuzzlePieceIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';

// The path to the background image has been updated here.
const STATIC_CARD_BACKGROUND_IMAGE = '/quizbackground.png';

export default function QuizCard({ quiz }: QuizTeaser & { completed?: boolean }) {
  const primaryTextColor = 'text-white';
  const secondaryTextColor = 'text-gray-200';

  return (
    <Link href={`/quizzes/${quiz.id}`} legacyBehavior>
      <a
        className={`
          group relative flex flex-col justify-between rounded-lg shadow-lg 
          hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden 
          aspect-[2/3] md:aspect-[3/4] transform hover:-translate-y-1 hover:scale-[1.03]
          bg-gray-700
        `}
      >
        {/* COMPLETION BADGE */}
        {quiz.completed && (
          <div className="absolute top-3 right-3 z-20" title="Completed">
            <CheckCircleIcon className="h-6 w-6 text-green-400 drop-shadow-lg" />
          </div>
        )}

        {/* Background Image */}
        <Image
          src={quiz.card_image_url || STATIC_CARD_BACKGROUND_IMAGE}
          alt={`${quiz.title} background`}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-300 group-hover:scale-110 z-0"
          priority
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10 z-10" />

        {/* Content */}
        <div
          className={`
            relative flex flex-col justify-end h-full p-3 sm:p-4 z-20 ${primaryTextColor}
          `}
        >
          <div className="mb-2">
            <div className="flex items-start mb-1 sm:mb-2">
              <PuzzlePieceIcon
                className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 mt-0.5 flex-shrink-0 ${primaryTextColor}`}
              />
              <h3
                className={`text-sm sm:text-base font-semibold leading-tight line-clamp-3 ${primaryTextColor}`}
                title={quiz.title}
              >
                {quiz.title}
              </h3>
            </div>
            {quiz.description && (
              <p
                className={`text-xs ${secondaryTextColor} line-clamp-2 sm:line-clamp-3`}
              >
                {quiz.description}
              </p>
            )}
          </div>

          <div
            className={`
              mt-auto flex justify-between items-center text-xs pt-2 border-t border-white/30 
              ${secondaryTextColor}
            `}
          >
            <span className="capitalize">
              {quiz.difficulty || 'N/A'} | {quiz.question_count || 0} Qs
            </span>
            <span className={`inline-flex items-center font-medium ${primaryTextColor}`}>
              {quiz.completed ? 'Review' : 'Start'}{' '}
              <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </span>
          </div>
        </div>
      </a>
    </Link>
  );
}