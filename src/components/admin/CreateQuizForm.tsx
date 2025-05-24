'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Topic } from '@/lib/constants'; // Your Topic type
import { useRouter } from 'next/navigation';

interface CreateQuizFormProps {
  topics: Topic[];
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function CreateQuizForm({ topics }: CreateQuizFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topicId, setTopicId] = useState<string>(topics[0]?.id || '');
  const [subtopicId, setSubtopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTopic = topics.find(t => t.id === topicId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (!title.trim()) {
      setError('Quiz title is required.');
      setIsLoading(false);
      return;
    }
    if (!topicId) {
      setError('Please select a main topic.');
      setIsLoading(false);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      topic_id: topicId,
      subtopic_id: subtopicId || null,
      difficulty,
    };

    try {
      const response = await fetch('/api/admin/quizzes', { // New API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to create quiz (Status: ${response.status})`);
      }

      setMessage(`Quiz "${result.quiz.title}" created successfully! You can now add questions to it.`);
      // Optionally redirect to the quiz management page for the new quiz
      // router.push(`/admin/quizzes/${result.quiz.id}/manage`);
      
      // Clear form
      setTitle('');
      setDescription('');
      setTopicId(topics[0]?.id || '');
      setSubtopicId('');
      setDifficulty('medium');

    } catch (err: any) {
      console.error('Create quiz error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md max-w-2xl">
      <div>
        <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-700 mb-1">
          Quiz Title <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          id="quizTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Leadership Fundamentals"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="quizDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="quizDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A brief overview of what this quiz covers."
          disabled={isLoading}
          className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="topicId" className="block text-sm font-medium text-gray-700 mb-1">
            Main Topic <span className="text-red-500">*</span>
          </label>
          <select
            id="topicId"
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value);
              setSubtopicId(''); // Reset subtopic when main topic changes
            }}
            required
            disabled={isLoading}
            className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          >
            <option value="" disabled>Select a main topic</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.title}</option>
            ))}
          </select>
        </div>

        {selectedTopic && selectedTopic.subtopics.length > 0 && (
          <div>
            <label htmlFor="subtopicId" className="block text-sm font-medium text-gray-700 mb-1">
              Subtopic (Optional)
            </label>
            <select
              id="subtopicId"
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              disabled={isLoading || !topicId}
              className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            >
              <option value="">None (general to main topic)</option>
              {selectedTopic.subtopics.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty Level
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
          disabled={isLoading}
          className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {message && (
        <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
          {error}
        </p>
      )}

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Quiz...' : 'Create Quiz'}
        </Button>
      </div>
    </form>
  );
}