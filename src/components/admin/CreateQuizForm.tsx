'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
// V-- CHANGES ARE HERE --V
import { Input } from '@/components/ui/input'; // Correct path is lowercase
import { Button } from '@/components/ui/button'; // Correct path is lowercase
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
// ^-- CHANGES ARE HERE --^
import Image from 'next/image';

interface CreateQuizFormValues {
  title: string;
  description: string;
}

const CreateQuizForm = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuizFormValues>();

  useEffect(() => {
    const fetchImages = async () => {
      const { data: files, error } = await supabase.storage
        .from('quiz-card-images')
        .list();

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      if (files) {
        const urls = files.map((file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('quiz-card-images')
            .getPublicUrl(file.name);
          return publicUrl;
        });
        setImageUrls(urls);
      }
    };

    fetchImages();
  }, [supabase]);

  const onSubmit = async (data: CreateQuizFormValues) => {
    if (!selectedImageUrl) {
      setError('You must select an image for the quiz card.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          card_image_url: selectedImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quiz');
      }

      const newQuiz = await response.json();
      router.push(`/admin/quizzes/${newQuiz.id}/manage`); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Quiz Title
        </label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          className="w-full"
          placeholder="e.g., Introduction to JavaScript"
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Input
          id="description"
          {...register('description')}
          className="w-full"
          placeholder="A brief summary of the quiz"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Select a Card Image</label>
        {imageUrls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imageUrls.map((url) => (
              <div
                key={url}
                onClick={() => setSelectedImageUrl(url)}
                className={`relative h-32 w-full rounded-lg cursor-pointer overflow-hidden border-4 transition-all ${
                  selectedImageUrl === url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-200'
                }`}
              >
                <Image src={url} alt="Quiz card image option" layout="fill" objectFit="cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading images...</p>
        )}
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