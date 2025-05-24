export interface SubTopic {
  id: string;
  title: string;
  description?: string; // Optional: a brief description for the subtopic
}

export interface Topic {
  id: string;
  title: string;
  description?: string; // Optional: a brief description for the main topic
  subtopics: SubTopic[];
  color?: string; // Optional: for styling nodes in the mind map
}

export const workforceTopics: Topic[] = [
  {
    id: 'leadership',
    title: 'Leadership',
    description: 'Developing skills to guide and inspire individuals and teams.',
    color: '#3B82F6', // Example color (Tailwind's blue-500)
    subtopics: [
      { id: 'ls-1', title: 'Situational Leadership' },
      { id: 'ls-2', title: 'Ethical Leadership' },
      { id: 'ls-3', title: 'Team Motivation' },
      { id: 'ls-4', title: 'Conflict Resolution' },
      { id: 'ls-5', title: 'Change Management' },
    ],
  },
  {
    id: 'resilience',
    title: 'Resilience',
    description: 'Building capacity to recover quickly from difficulties.',
    color: '#10B981', // Example color (Tailwind's emerald-500)
    subtopics: [
      { id: 'rs-1', title: 'Stress Management' },
      { id: 'rs-2', title: 'Adaptability' },
      { id: 'rs-3', title: 'Positive Mindset' },
      { id: 'rs-4', title: 'Problem Solving Under Pressure' },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    description: 'Working effectively with others to achieve common goals.',
    color: '#F59E0B', // Example color (Tailwind's amber-500)
    subtopics: [
      { id: 'cl-1', title: 'Teamwork Dynamics' },
      { id: 'cl-2', title: 'Cross-functional Projects' },
      { id: 'cl-3', title: 'Building Trust' },
      { id: 'cl-4', title: 'Effective Meetings' },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Clearly conveying and receiving information.',
    color: '#EC4899', // Example color (Tailwind's pink-500)
    subtopics: [
      { id: 'cm-1', title: 'Active Listening' },
      { id: 'cm-2', title: 'Verbal Communication' },
      { id: 'cm-3', title: 'Written Communication' },
      { id: 'cm-4', title: 'Non-verbal Cues' },
      { id: 'cm-5', title: 'Public Speaking' },
    ],
  },
  {
    id: 'personal-well-being',
    title: 'Personal Well-being',
    description: 'Maintaining physical, mental, and emotional health.',
    color: '#8B5CF6', // Example color (Tailwind's violet-500)
    subtopics: [
      { id: 'pw-1', title: 'Work-Life Balance' },
      { id: 'pw-2', title: 'Mindfulness' },
      { id: 'pw-3', title: 'Physical Health' },
      { id: 'pw-4', title: 'Emotional Intelligence' },
    ],
  },
  {
    id: 'critical-thinking',
    title: 'Critical Thinking',
    description: 'Analyzing information objectively to form judgments.',
    color: '#6366F1', // Example color (Tailwind's indigo-500)
    subtopics: [
      { id: 'ct-1', title: 'Problem Analysis' },
      { id: 'ct-2', title: 'Decision Making' },
      { id: 'ct-3', title: 'Logical Reasoning' },
      { id: 'ct-4', title: 'Evaluating Arguments' },
    ],
  },
  {
    id: 'career-development',
    title: 'Career Development',
    description: 'Planning and managing professional growth and progression.',
    color: '#06B6D4', // Example color (Tailwind's cyan-500)
    subtopics: [
      { id: 'cd-1', title: 'Goal Setting' },
      { id: 'cd-2', title: 'Networking' },
      { id: 'cd-3', title: 'Skill Development' },
      { id: 'cd-4', title: 'Resume Building' },
      { id: 'cd-5', title: 'Interview Skills' },
    ],
  },
  {
    id: 'global-fluency',
    title: 'Global Fluency',
    description: 'Understanding and navigating diverse cultural contexts.',
    color: '#D946EF', // Example color (Tailwind's fuchsia-500)
    subtopics: [
      { id: 'gf-1', title: 'Cultural Awareness' },
      { id: 'gf-2', title: 'Cross-cultural Communication' },
      { id: 'gf-3', title: 'Global Business Trends' },
      { id: 'gf-4', title: 'Working in Diverse Teams' },
    ],
  },
  {
    id: 'creativity',
    title: 'Creativity',
    description: 'Generating novel ideas and solutions.',
    color: '#F97316', // Example color (Tailwind's orange-500)
    subtopics: [
      { id: 'cr-1', title: 'Innovation Techniques' },
      { id: 'cr-2', title: 'Brainstorming' },
      { id: 'cr-3', title: 'Design Thinking' },
      { id: 'cr-4', title: 'Creative Problem Solving' },
    ],
  },
  {
    id: 'technology',
    title: 'Technology',
    description: 'Understanding and utilizing current and emerging technologies.',
    color: '#4B5563', // Example color (Tailwind's gray-600)
    subtopics: [
      { id: 'tc-1', title: 'Digital Literacy' },
      { id: 'tc-2', title: 'AI and Machine Learning Basics' },
      { id: 'tc-3', title: 'Data Analysis Tools' },
      { id: 'tc-4', title: 'Cybersecurity Awareness' },
      { id: 'tc-5', title: 'Cloud Computing Concepts' },
    ],
  },
];

// --- Gamification Point Constants ---
export const POINTS_FOR_CHAT_MESSAGE = 1; // For each message sent or AI response received

export const POINTS_FOR_GOAL_ADD = 5;
export const POINTS_FOR_GOAL_STATUS_CHANGE = 2; // e.g., for moving to 'in_progress'
export const POINTS_FOR_COMPLETING_GOAL = 10;

export const POINTS_PER_QUIZ_QUESTION_CORRECT = 2; // Points for each correct answer in a quiz
// You might also have points for completing a quiz itself, e.g., POINTS_FOR_QUIZ_COMPLETION = 15;

// Add any other app-wide constants here as your application grows.