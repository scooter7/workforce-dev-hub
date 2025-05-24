// src/types/quiz.ts

export interface QuestionOption {
  id: string; // UUID from question_options table
  question_id?: string; // Foreign key, might be omitted in some contexts if nested
  option_text: string;
  is_correct?: boolean; // Should NOT be sent to client before submission for taking a quiz
                        // Can be included for admin views or after submission
}

export interface QuizQuestion {
  id: string; // UUID from quiz_questions table
  quiz_id?: string; // Foreign key
  question_text: string;
  question_type: 'multiple-choice' | 'true-false'; // Extend as needed
  explanation?: string | null;
  points: number;
  order_num: number;
  options: QuestionOption[]; // For multiple-choice questions
}

export interface QuizData { // For when a quiz and all its questions/options are loaded
  id: string; // UUID from quizzes table
  title: string;
  description?: string | null;
  topic_id: string;
  subtopic_id?: string | null; // Added subtopic_id
  difficulty?: string | null; // Added difficulty
  questions: QuizQuestion[];
}

// For displaying a list of quizzes (teaser info)
export interface QuizTeaser {
  id: string;
  topic_id: string;
  subtopic_id?: string | null;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  question_count?: number;
  created_at?: string;
}