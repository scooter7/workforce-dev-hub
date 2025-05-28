// src/lib/constants.ts

export const APP_NAME = 'Workforce Development Hub';
export const APP_DESCRIPTION = 'Your platform for professional growth, AI chat, and goal tracking.';

export interface SubTopic {
  id: string;
  title: string;
  description?: string;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: any; // Placeholder for now
  subtopics: SubTopic[];
  // New field to categorize this topic under a high-level theme
  highLevelCategoryKey?: HighLevelCategoryKey; 
}

// Define keys for your high-level categories
export type HighLevelCategoryKey = 'career-growth' | 'interpersonal-skills' | 'personal-well-being';

export interface HighLevelCategory {
  id: HighLevelCategoryKey;
  title: string;
  description: string;
  // Add an icon or image path if you want visual representation for these choices
  // illustration?: string; // e.g., path to an image in /public
}

// Define your high-level categories
export const highLevelCategories: HighLevelCategory[] = [
  { 
    id: 'career-growth', 
    title: 'Career Growth', 
    description: 'Develop skills and strategies to advance your professional journey.',
    // illustration: '/images/career-growth.svg', // Example
  },
  { 
    id: 'interpersonal-skills', 
    title: 'Interpersonal Skills', 
    description: 'Enhance your ability to communicate and collaborate effectively.',
    // illustration: '/images/interpersonal-skills.svg', // Example
  },
  { 
    id: 'personal-well-being', 
    title: 'Personal Well-being', 
    description: 'Cultivate resilience and a healthy work-life integration.',
    // illustration: '/images/personal-well-being.svg', // Example
  },
];

// Helper to create kebab-case IDs (remains the same)
const createKebabCaseId = (title: string, prefix: string = ''): string => {
  const baseId = title.toLowerCase().replace(/\s+/g, '-').replace(/[&']/g, '').replace(/[^a-z0-9-]/g, '');
  return prefix ? `${prefix}-${baseId}` : baseId;
};

// Your detailed topics, now with an optional 'highLevelCategoryKey'
export const workforceTopics: Topic[] = [
  {
    id: 'leadership', title: 'Leadership', highLevelCategoryKey: 'interpersonal-skills',
    description: 'Exploring various facets of effective leadership.', color: '#3B82F6', // blue-500
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
    id: 'resilience', title: 'Resilience', highLevelCategoryKey: 'personal-well-being',
    description: 'Building mental and emotional strength.', color: '#10B981', // emerald-500
    subtopics: [ /* ... your resilience subtopics ... */ 
        { id: createKebabCaseId('Growth Mindset', 'resilience'), title: 'Growth Mindset' },
        { id: createKebabCaseId('Imposter Syndrome', 'resilience'), title: 'Imposter Syndrome' },
        { id: createKebabCaseId('Time Blocking', 'resilience'), title: 'Time Blocking' },
        { id: createKebabCaseId('Time Management', 'resilience'), title: 'Time Management' },
        { id: createKebabCaseId('Goal Setting', 'resilience'), title: 'Goal Setting' },
        { id: createKebabCaseId('Learning Agility', 'resilience'), title: 'Learning Agility' },
    ],
  },
  {
    id: 'collaboration', title: 'Collaboration', highLevelCategoryKey: 'interpersonal-skills',
    description: 'Working effectively with others.', color: '#F59E0B', // amber-500
    subtopics: [ /* ... your collaboration subtopics ... */ 
        { id: createKebabCaseId('Active Listening', 'collaboration'), title: 'Active Listening' },
        { id: createKebabCaseId('Empathy & Understanding', 'collaboration'), title: 'Empathy & Understanding' },
        { id: createKebabCaseId('Team Dynamics', 'collaboration'), title: 'Team Dynamics' },
        { id: createKebabCaseId('Messaging', 'collaboration'), title: 'Messaging' },
        { id: createKebabCaseId('Building Trust', 'collaboration'), title: 'Building Trust' },
        { id: createKebabCaseId('Conflict Resolution', 'collaboration'), title: 'Conflict Resolution' },
    ],
  },
  {
    id: 'communication', title: 'Communication', highLevelCategoryKey: 'interpersonal-skills',
    description: 'Mastering clear and impactful communication.', color: '#8B5CF6', // violet-500
    subtopics: [ /* ... your communication subtopics ... */ 
        { id: createKebabCaseId('Storytelling & Messaging', 'communication'), title: 'Storytelling & Messaging' },
        { id: createKebabCaseId('Negotiation', 'communication'), title: 'Negotiation' },
        { id: createKebabCaseId('Personal Branding', 'communication'), title: 'Personal Branding' },
        { id: createKebabCaseId('Presentation Skills', 'communication'), title: 'Presentation Skills' },
        { id: createKebabCaseId('Social Media', 'communication'), title: 'Social Media' },
        { id: createKebabCaseId('Mastering Feedback', 'communication'), title: 'Mastering Feedback' },
    ],
  },
  {
    id: 'personal-well-being-topic', title: 'Personal Well Being', highLevelCategoryKey: 'personal-well-being', // Renamed ID to avoid clash
    description: 'Focusing on holistic health and balance.', color: '#EC4899', // pink-500
    subtopics: [ /* ... your personal well-being subtopics ... */ 
        { id: createKebabCaseId('Physical Health', 'pwb'), title: 'Physical Health' },
        { id: createKebabCaseId('Emotional Health', 'pwb'), title: 'Emotional Health' },
        { id: createKebabCaseId('Work-Life Balance', 'pwb'), title: 'Work-Life Balance' },
        { id: createKebabCaseId('Mental Health', 'pwb'), title: 'Mental Health' },
        { id: createKebabCaseId('Financial Health', 'pwb'), title: 'Financial Health' },
        { id: createKebabCaseId('Stress Management', 'pwb'), title: 'Stress Management' },
    ],
  },
  {
    id: 'critical-thinking', title: 'Critical Thinking', highLevelCategoryKey: 'career-growth',
    description: 'Developing analytical abilities.', color: '#6366F1', // indigo-500
    subtopics: [ /* ... your critical thinking subtopics ... */ 
        { id: createKebabCaseId('Data-Driven Decision Making', 'ct'), title: 'Data-Driven Decision Making' },
        { id: createKebabCaseId('Visioning', 'ct'), title: 'Visioning' },
        { id: createKebabCaseId('Strategy & Planning', 'ct'), title: 'Strategy & Planning' }, // Kept one
        { id: createKebabCaseId('Ethics', 'ct'), title: 'Ethics' },
    ],
  },
  {
    id: 'career-development', title: 'Career Development', highLevelCategoryKey: 'career-growth',
    description: 'Navigating your professional journey.', color: '#06B6D4', // cyan-500
    subtopics: [ /* ... your career development subtopics ... */ 
        { id: createKebabCaseId('Personal Branding', 'cd'), title: 'Personal Branding' },
        { id: createKebabCaseId('Career Transitioning', 'cd'), title: 'Career Transitioning' },
        { id: createKebabCaseId('Presentation Skills', 'cd'), title: 'Presentation Skills' },
        { id: createKebabCaseId('Resume Building', 'cd'), title: 'Resume Building' },
        { id: createKebabCaseId('Interview Skills', 'cd'), title: 'Interview Skills' },
    ],
  },
  {
    id: 'global-fluency', title: 'Global Fluency', highLevelCategoryKey: 'interpersonal-skills',
    description: 'Understanding global contexts.', color: '#D97706', // amber-600
    subtopics: [ /* ... your global fluency subtopics ... */ 
        { id: createKebabCaseId('World Views', 'gf'), title: 'World Views' },
        { id: createKebabCaseId('Understanding Global Markets & Trends', 'gf'), title: 'Understanding Global Markets & Trends' },
        { id: createKebabCaseId('Intercultural Competency', 'gf'), title: 'Intercultural Competency' },
        { id: createKebabCaseId('Global Communication Skills', 'gf'), title: 'Global Communication Skills' },
        { id: createKebabCaseId('Cultural Awareness & Sensitivity', 'gf'), title: 'Cultural Awareness & Sensitivity' },
        { id: createKebabCaseId('Adaptability & Agility', 'gf'), title: 'Adaptability & Agility' },
    ],
  },
  {
    id: 'creativity', title: 'Creativity', highLevelCategoryKey: 'interpersonal-skills', // Or 'Career Growth'? You decide.
    description: 'Fostering innovation.', color: '#EF4444', // red-500
    subtopics: [ /* ... your creativity subtopics ... */ 
        { id: createKebabCaseId('Innovation & Experimentation', 'creativity'), title: 'Innovation & Experimentation' },
        { id: createKebabCaseId('Cross-Disciplinary Collaboration', 'creativity'), title: 'Cross-Disciplinary Collaboration' },
        { id: createKebabCaseId('Empowerment & Autonomy', 'creativity'), title: 'Empowerment & Autonomy' },
    ],
  },
  {
    id: 'technology', title: 'Technology', highLevelCategoryKey: 'career-growth',
    description: 'Leveraging technology effectively.', color: '#6B7280', // gray-500
    subtopics: [ /* ... your technology subtopics ... */ 
        { id: createKebabCaseId('Data-Driven Decision Making', 'tech'), title: 'Data-Driven Decision Making' },
        { id: createKebabCaseId('Innovation & Change Management', 'tech'), title: 'Innovation & Change Management' },
        { id: createKebabCaseId('Vision & Strategy Alignment', 'tech'), title: 'Vision & Strategy Alignment' },
        { id: createKebabCaseId('Cyber Security & Risk Management', 'tech'), title: 'Cyber Security & Risk Management' },
        { id: createKebabCaseId('Artificial Intelligence', 'tech'), title: 'Artificial Intelligence' },
        { id: createKebabCaseId('Ethics & Sustainability', 'tech'), title: 'Ethics & Sustainability' },
    ],
  },
];

// Constants for points system
export const POINTS_FOR_CHAT_MESSAGE = 1;
export const POINTS_FOR_QUIZ_QUESTION_CORRECT = 2; // Default if question.points is not set
export const POINTS_FOR_GOAL_ADD = 5;
export const POINTS_FOR_GOAL_STATUS_CHANGE = 2; // For moving to in_progress
export const POINTS_FOR_COMPLETING_GOAL = 10;