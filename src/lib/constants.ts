// src/lib/constants.ts

export const APP_NAME = 'Workforce Development Hub';
export const APP_DESCRIPTION = 'Your platform for professional growth, AI chat, and goal tracking.';

export interface SubTopic {
  id: string; // kebab-case version of title, e.g., "transformational-leadership"
  title: string;
  description?: string; // Optional: a brief description of the subtopic
}

export interface Topic {
  id: string; // kebab-case version of title, e.g., "leadership"
  title: string;
  description?: string; // Optional: a brief description of the topic
  color?: string; // Optional: a color for UI elements, e.g., Tailwind color like 'bg-blue-500' or hex
  icon?: any; // Optional: an icon component or SVG string
  subtopics: SubTopic[];
}

// Helper to create kebab-case IDs and ensure uniqueness for subtopics if titles repeat
const createKebabCaseId = (title: string, prefix: string = ''): string => {
  const baseId = title.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '');
  return prefix ? `${prefix}-${baseId}` : baseId;
};

export const workforceTopics: Topic[] = [
  {
    id: 'leadership',
    title: 'Leadership',
    description: 'Exploring various facets of effective leadership.',
    color: '#3B82F6', // blue-500
    subtopics: [
      { id: createKebabCaseId('Transformational Leadership', 'leadership'), title: 'Transformational Leadership' },
      { id: createKebabCaseId('Emotional Intelligence', 'leadership'), title: 'Emotional Intelligence' },
      { id: createKebabCaseId('Problem Solving', 'leadership'), title: 'Problem Solving' },
      { id: createKebabCaseId('Authenticity', 'leadership'), title: 'Authenticity' },
      { id: createKebabCaseId('Diversity, Equity & Inclusion', 'leadership'), title: 'Diversity, Equity & Inclusion' },
      { id: createKebabCaseId('Next-Level Leadership', 'leadership'), title: 'Next-Level Leadership' },
    ],
  },
  {
    id: 'resilience',
    title: 'Resilience',
    description: 'Building mental and emotional strength.',
    color: '#10B981', // emerald-500
    subtopics: [
      { id: createKebabCaseId('Growth Mindset', 'resilience'), title: 'Growth Mindset' },
      { id: createKebabCaseId('Imposter Syndrome', 'resilience'), title: 'Imposter Syndrome' },
      { id: createKebabCaseId('Time Blocking', 'resilience'), title: 'Time Blocking' },
      { id: createKebabCaseId('Time Management', 'resilience'), title: 'Time Management' },
      { id: createKebabCaseId('Goal Setting', 'resilience'), title: 'Goal Setting' },
      { id: createKebabCaseId('Learning Agility', 'resilience'), title: 'Learning Agility' },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    description: 'Working effectively with others.',
    color: '#F59E0B', // amber-500
    subtopics: [
      { id: createKebabCaseId('Active Listening', 'collaboration'), title: 'Active Listening' },
      { id: createKebabCaseId('Empathy & Understanding', 'collaboration'), title: 'Empathy & Understanding' },
      { id: createKebabCaseId('Team Dynamics', 'collaboration'), title: 'Team Dynamics' },
      { id: createKebabCaseId('Messaging', 'collaboration'), title: 'Messaging' }, // Note: "Messaging" also in Communication
      { id: createKebabCaseId('Building Trust', 'collaboration'), title: 'Building Trust' },
      { id: createKebabCaseId('Conflict Resolution', 'collaboration'), title: 'Conflict Resolution' },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Mastering the art of clear and impactful communication.',
    color: '#8B5CF6', // violet-500
    subtopics: [
      { id: createKebabCaseId('Storytelling & Messaging', 'communication'), title: 'Storytelling & Messaging' },
      { id: createKebabCaseId('Negotiation', 'communication'), title: 'Negotiation' },
      { id: createKebabCaseId('Personal Branding', 'communication'), title: 'Personal Branding' }, // Also in Career Dev
      { id: createKebabCaseId('Presentation Skills', 'communication'), title: 'Presentation Skills' }, // Also in Career Dev
      { id: createKebabCaseId('Social Media', 'communication'), title: 'Social Media' },
      { id: createKebabCaseId('Mastering Feedback', 'communication'), title: 'Mastering Feedback' },
    ],
  },
  {
    id: 'personal-well-being',
    title: 'Personal Well Being',
    description: 'Focusing on holistic health and balance.',
    color: '#EC4899', // pink-500
    subtopics: [
      { id: createKebabCaseId('Physical Health', 'personal-well-being'), title: 'Physical Health' },
      { id: createKebabCaseId('Emotional Health', 'personal-well-being'), title: 'Emotional Health' },
      { id: createKebabCaseId('Work-Life Balance', 'personal-well-being'), title: 'Work-Life Balance' },
      { id: createKebabCaseId('Mental Health', 'personal-well-being'), title: 'Mental Health' },
      { id: createKebabCaseId('Financial Health', 'personal-well-being'), title: 'Financial Health' },
      { id: createKebabCaseId('Stress Management', 'personal-well-being'), title: 'Stress Management' },
    ],
  },
  {
    id: 'critical-thinking',
    title: 'Critical Thinking',
    description: 'Developing analytical and problem-solving abilities.',
    color: '#6366F1', // indigo-500
    subtopics: [
      { id: createKebabCaseId('Data-Driven Decision Making', 'critical-thinking'), title: 'Data-Driven Decision Making' }, // Also in Tech
      { id: createKebabCaseId('Visioning', 'critical-thinking'), title: 'Visioning' },
      { id: createKebabCaseId('Strategy & Planning', 'critical-thinking'), title: 'Strategy & Planning' }, // "Planning & Strategy" was listed twice
      { id: createKebabCaseId('Ethics', 'critical-thinking'), title: 'Ethics' }, // Also in Tech
    ],
  },
  {
    id: 'career-development',
    title: 'Career Development',
    description: 'Navigating and advancing your professional journey.',
    color: '#06B6D4', // cyan-500
    subtopics: [
      { id: createKebabCaseId('Personal Branding', 'career-development'), title: 'Personal Branding' }, // Also in Communication
      { id: createKebabCaseId('Career Transitioning', 'career-development'), title: 'Career Transitioning' },
      { id: createKebabCaseId('Presentation Skills', 'career-development'), title: 'Presentation Skills' }, // Also in Communication
      { id: createKebabCaseId('Resume Building', 'career-development'), title: 'Resume Building' },
      { id: createKebabCaseId('Interview Skills', 'career-development'), title: 'Interview Skills' },
    ],
  },
  {
    id: 'global-fluency',
    title: 'Global Fluency',
    description: 'Understanding and navigating global contexts.',
    color: '#D97706', // amber-600 (slightly darker amber)
    subtopics: [
      { id: createKebabCaseId('World Views', 'global-fluency'), title: 'World Views' },
      { id: createKebabCaseId('Understanding Global Markets & Trends', 'global-fluency'), title: 'Understanding Global Markets & Trends' },
      { id: createKebabCaseId('Intercultural Competency', 'global-fluency'), title: 'Intercultural Competency' },
      { id: createKebabCaseId('Global Communication Skills', 'global-fluency'), title: 'Global Communication Skills' },
      { id: createKebabCaseId('Cultural Awareness & Sensitivity', 'global-fluency'), title: 'Cultural Awareness & Sensitivity' },
      { id: createKebabCaseId('Adaptability & Agility', 'global-fluency'), title: 'Adaptability & Agility' },
    ],
  },
  {
    id: 'creativity',
    title: 'Creativity',
    description: 'Fostering innovation and original thought.',
    color: '#EF4444', // red-500
    subtopics: [
      { id: createKebabCaseId('Innovation & Experimentation', 'creativity'), title: 'Innovation & Experimentation' },
      { id: createKebabCaseId('Cross-Disciplinary Collaboration', 'creativity'), title: 'Cross-Disciplinary Collaboration' },
      { id: createKebabCaseId('Empowerment & Autonomy', 'creativity'), title: 'Empowerment & Autonomy' },
    ],
  },
  {
    id: 'technology',
    title: 'Technology',
    description: 'Leveraging technology for growth and efficiency.',
    color: '#6B7280', // gray-500
    subtopics: [
      { id: createKebabCaseId('Data-Driven Decision Making', 'technology'), title: 'Data-Driven Decision Making' }, // Also in Critical Thinking
      { id: createKebabCaseId('Innovation & Change Management', 'technology'), title: 'Innovation & Change Management' },
      { id: createKebabCaseId('Vision & Strategy Alignment', 'technology'), title: 'Vision & Strategy Alignment' },
      { id: createKebabCaseId('Cyber Security & Risk Management', 'technology'), title: 'Cyber Security & Risk Management' },
      { id: createKebabCaseId('Artificial Intelligence', 'technology'), title: 'Artificial Intelligence' },
      { id: createKebabCaseId('Ethics & Sustainability', 'technology'), title: 'Ethics & Sustainability' }, // Note "Ethics" also in Crit. Think.
    ],
  },
];

// Constants for points system
export const POINTS_FOR_CHAT_MESSAGE = 1;
export const POINTS_FOR_QUIZ_QUESTION_CORRECT = 2; // Default if question.points is not set
export const POINTS_FOR_GOAL_ADD = 5;
export const POINTS_FOR_GOAL_STATUS_CHANGE = 2; // For moving to in_progress
export const POINTS_FOR_COMPLETING_GOAL = 10;