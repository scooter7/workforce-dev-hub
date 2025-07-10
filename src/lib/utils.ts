// src/lib/utils.ts
import { Topic } from './constants';
import { QuizTeaser } from '@/types/quiz';

/**
 * Defines the shape of the object returned by the grouping function.
 */
interface GroupedQuizzes {
  quizzesBySubtopic: Record<string, (QuizTeaser & { completed: boolean })[]>;
  quizzesByMainTopicOnly: Record<string, (QuizTeaser & { completed: boolean })[]>;
}

/**
 * Groups a flat list of quizzes by their topic and subtopic.
 * @param quizzes - The array of all quizzes to be grouped.
 * @param topics - The array of all workforce topics and their subtopics.
 * @returns An object containing quizzes grouped by subtopic ID and by main topic ID.
 */
export function groupQuizzesByTopic(
  quizzes: (QuizTeaser & { completed: boolean })[],
  topics: Topic[]
): GroupedQuizzes {
  const quizzesBySubtopic: Record<string, (QuizTeaser & { completed: boolean })[]> = {};
  const quizzesByMainTopicOnly: Record<string, (QuizTeaser & { completed: boolean })[]> = {};

  // Pre-initialize the keys to ensure every topic/subtopic has an entry, even if empty
  topics.forEach(topic => {
    quizzesByMainTopicOnly[topic.id] = [];
    topic.subtopics.forEach(subtopic => {
      quizzesBySubtopic[subtopic.id] = [];
    });
  });

  // Group the quizzes
  quizzes.forEach((quiz) => {
    if (quiz.subtopic_id && quizzesBySubtopic[quiz.subtopic_id]) {
      quizzesBySubtopic[quiz.subtopic_id].push(quiz);
    } else if (quiz.topic_id && quizzesByMainTopicOnly[quiz.topic_id]) {
      quizzesByMainTopicOnly[quiz.topic_id].push(quiz);
    }
  });

  return { quizzesBySubtopic, quizzesByMainTopicOnly };
}