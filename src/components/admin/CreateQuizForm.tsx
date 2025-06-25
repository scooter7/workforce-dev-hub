'use client'; // <-- Add this line at the very top

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

// The form will now only manage title and description directly.
interface CreateQuizFormValues {
  title: string;
  description: string;
}

const CreateQuizForm = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to hold the image URLs from Supabase Storage
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // State to track which image is currently selected
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuizFormValues>();

  // This effect runs once to fetch the list of available images from your bucket.
  useEffect(() => {
    const fetchImages = async () => {
      const { data: files, error } = await supabase.storage
        .from('quiz-card-images') // Your bucket name
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
          card_image_url: selectedImageUrl, // Send the selected image URL to the API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quiz');
      }

      const newQuiz = await response.json();
      // Redirect to the page to manage the new quiz's questions
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

      {/* --- New Image Selector Section --- */}
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
      {/* --- End Image Selector Section --- */}

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