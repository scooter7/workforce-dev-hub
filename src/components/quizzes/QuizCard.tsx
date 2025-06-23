'use client';

import Link from 'next/link';
import { QuizTeaser } from '@/types/quiz';
import {
  CheckCircleIcon,
  SignalIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { gradients } from '@/lib/constants';

interface QuizCardProps extends QuizTeaser {
  completed?: boolean;
  topicIndex: number;
}

export default function QuizCard({
  id,
  title,
  description,
  difficulty,
  question_count,
  completed,
  topicIndex,
}: QuizCardProps) {
  const topicGradient = gradients[topicIndex >= 0 ? topicIndex % gradients.length : 0];

  return (
    <Link href={`/quizzes/${id}`} legacyBehavior>
      <a className="group block rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2">
        {/* Top Colored Section */}
        <div
          className="relative text-white p-5 rounded-t-xl flex flex-col justify-between h-40"
          style={{ background: topicGradient }}
        >
          {completed && (
            <div className="absolute top-2 right-2 z-10" title="Completed">
              <CheckCircleIcon className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          )}
          <h3 className="text-lg font-bold leading-tight line-clamp-3" title={title}>
            {title}
          </h3>
          {/* --- THIS LINE IS CORRECTED --- */}
          <p className="text-xs text-white/80 mt-1 line-clamp-2" title={description ?? undefined}>
            {description}
          </p>
        </div>

        {/* Bottom White Section */}
        <div className="bg-white p-4 rounded-b-xl space-y-3 text-sm">
          <div className="flex items-center text-gray-600">
            <SignalIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="font-medium">Difficulty:</span>
            <span className="ml-auto font-semibold text-neutral-text capitalize">{difficulty || 'N/A'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="font-medium">Questions:</span>
            <span className="ml-auto font-semibold text-neutral-text">{question_count || 0}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <SparklesIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="font-medium">Points:</span>
            <span className="ml-auto font-semibold text-neutral-text">{(question_count || 0) * 2}</span>
          </div>
        </div>
      </a>
    </Link>
  );
}