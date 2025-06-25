import Link from 'next/link';
import { QuizTeaser } from '@/types/quiz';
import Image from 'next/image';

interface QuizCardProps {
  quiz: QuizTeaser;
}

// This function remains as a fallback for quizzes without an image
const getGradient = (title: string) => {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-400 to-blue-500',
    'from-yellow-400 to-orange-500',
    'from-pink-500 to-red-500',
    'from-indigo-500 to-blue-500',
  ];
  const charCodeSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[charCodeSum % gradients.length];
};

const QuizCard = ({ quiz }: QuizCardProps) => {
  const gradientClass = getGradient(quiz.title);

  return (
    <Link href={`/quizzes/${quiz.id}`} legacyBehavior>
      <a className="block transform hover:-translate-y-1 transition-transform duration-300">
        <div className="relative w-full h-80 rounded-2xl shadow-lg overflow-hidden text-white group">
          
          {/* --- Conditional Rendering Logic --- */}
          {/* If a card_image_url exists, use it in an Image component. */}
          {quiz.card_image_url ? (
            <Image
              src={quiz.card_image_url}
              alt={`Image for ${quiz.title}`}
              layout="fill"
              objectFit="cover"
              className="z-0 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            // Otherwise, fall back to the original gradient div.
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} z-0`}></div>
          )}
          {/* --- End Conditional Rendering --- */}

          {/* This overlay adds a dark tint so the text is always readable */}
          <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>

          {/* The text content is layered on top */}
          <div className="relative h-full flex flex-col justify-between p-6 z-20">
            <div>
              <h3 className="text-2xl font-bold leading-tight">{quiz.title}</h3>
              {quiz.description && <p className="mt-2 text-gray-200 line-clamp-3">{quiz.description}</p>}
            </div>
            <div className="mt-4">
              <span className="text-sm font-semibold bg-black bg-opacity-30 px-2 py-1 rounded-full">
                {quiz.question_count} {quiz.question_count === 1 ? 'Question' : 'Questions'}
              </span>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default QuizCard;