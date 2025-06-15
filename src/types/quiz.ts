/**
 * Defines the possible positions for media (image/video) relative to the question text.
 */
export type MediaPosition = 'above_text' | 'below_text' | 'left_of_text' | 'right_of_text';

/**
 * Represents a single answer option for a quiz question.
 */
export interface QuestionOption {
  id: string; // UUID from question_options table
  question_id?: string; // Foreign key, can be omitted if directly nested and implied by context
  option_text: string;
  is_correct: boolean; // This is a non-optional boolean, as it exists in the DB
}

/**
 * Represents a single question within a quiz.
 */
export interface QuizQuestion {
  id: string; // UUID from quiz_questions table
  quiz_id?: string; // Foreign key, can be omitted if directly nested
  question_text: string;
  question_type: 'multiple-choice' | 'true-false'; // Extend with more types as needed
  explanation?: string | null; // Explanation shown after answering
  points: number; // Points for correctly answering this question
  order_num: number; // Sequence of the question within the quiz
  options: QuestionOption[]; // Array of answer options, especially for multiple-choice
  
  // Fields for media
  image_url?: string | null;
  video_url?: string | null;
  media_position?: MediaPosition | null;
}

/**
 * Represents the full data for a quiz, including its questions and options.
 * Useful when a user is taking a quiz or an admin is viewing full quiz details.
 */
export interface QuizData {
  id: string; // UUID from quizzes table
  title: string;
  description?: string | null;
  topic_id: string; // Links to a topic (e.g., from constants.ts or a topics table)
  subtopic_id?: string | null; // Optional subtopic link
  difficulty?: string | null; // e.g., 'easy', 'medium', 'hard'
  questions: QuizQuestion[]; // Array of all questions in the quiz (now with potential media fields)
}

/**
 * Represents a summary or "teaser" of a quiz, typically used for listing available quizzes.
 */
export interface QuizTeaser {
  id: string;
  topic_id: string;
  subtopic_id?: string | null;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  question_count?: number; // Total number of questions in the quiz
  created_at?: string; // ISO date string, optional for display
  card_image_url?: string | null; // <<< ADDED FOR NETFLIX-STYLE CARDS
  /** Indicates whether the current user has completed this quiz */
  completed?: boolean;
}

// You can add other quiz-related shared types here as needed.
