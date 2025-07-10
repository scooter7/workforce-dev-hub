'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Topic, SubTopic } from '../../lib/constants';
import Image from 'next/image';

import Input from '../ui/Input';
import Button from '../ui/Button';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';


interface CreateQuizFormProps {
  topics: Topic[];
}

interface FormValues {
  title: string;
  description: string;
  topicId: string;
  subtopicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const CreateQuizForm: React.FC<CreateQuizFormProps> = ({ topics }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const [subtopics, setSubtopics] = useState<SubTopic[]>([]);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      difficulty: 'medium',
      subtopicId: '',
    },
  });

  const selectedTopicId = watch('topicId');

  useEffect(() => {
    const selectedTopic = topics.find(t => t.id === selectedTopicId);
    setSubtopics(selectedTopic?.subtopics || []);
  }, [selectedTopicId, topics]);

  useEffect(() => {
    const fetchImages = async () => {
      const { data: files, error } = await supabase.storage.from('quiz-card-images').list();
      if (error) {
        console.error('Error fetching images:', error);
        return;
      }
      if (files) {
        const urls = files.map(file => supabase.storage.from('quiz-card-images').getPublicUrl(file.name).data.publicUrl);
        setImageUrls(urls);
      }
    };
    fetchImages();
  }, [supabase]);

  const onSubmit = async (data: FormValues) => {
    if (!selectedImageUrl) {
        setError("Please select a card image.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          topic_id: data.topicId,
          subtopic_id: data.subtopicId || null,
          difficulty: data.difficulty,
          card_image_url: selectedImageUrl,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }
      const newQuiz = await response.json();
      router.push(`/admin/quizzes/${newQuiz.quiz.id}/manage`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="topicId" className="block text-sm font-medium text-gray-700">Topic</label>
          <select id="topicId" {...register('topicId', { required: 'Topic is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="">Select a topic...</option>
            {topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
          </select>
          {errors.topicId && <p className="text-sm text-red-600 mt-1">{errors.topicId.message}</p>}
        </div>
        <div>
          <label htmlFor="subtopicId" className="block text-sm font-medium text-gray-700">Subtopic (Optional)</label>
          <select id="subtopicId" {...register('subtopicId')} disabled={!selectedTopicId || subtopics.length === 0} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-50">
            <option value="">Select a subtopic...</option>
            {subtopics.map(sub => <option key={sub.id} value={sub.id}>{sub.title}</option>)}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Quiz Title</label>
        <Input id="title" {...register('title', { required: 'Title is required' })} className="mt-1 w-full" />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Input id="description" {...register('description')} className="mt-1 w-full" />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Select a Card Image</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imageUrls.map((url) => (
              <div key={url} onClick={() => setSelectedImageUrl(url)} className={`relative h-32 w-full rounded-lg cursor-pointer overflow-hidden border-4 transition-all ${selectedImageUrl === url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-200'}`}>
                <Image src={url} alt="Quiz card image option" layout="fill" objectFit="cover" />
              </div>
            ))}
        </div>
        {!selectedImageUrl && <p className="text-sm text-red-600 mt-1">Please select an image.</p>}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting || !selectedImageUrl}>
          {isSubmitting ? 'Creating...' : 'Create Quiz and Add Questions'}
        </Button>
      </div>

      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </form>
  );
};

export default CreateQuizForm;