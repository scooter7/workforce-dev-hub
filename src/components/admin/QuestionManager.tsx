/*
* FILE: src/components/admin/QuestionManager.tsx
* This component now finds the last used video URL and passes it to the form.
*/
'use client';

import { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import AddQuestionForm from './AddQuestionForm';
import Modal from '@/components/ui/Modal';
import type { QuizQuestion } from '@/types/quiz';
import { Trash2, Edit, Video } from 'lucide-react';
import Link from 'next/link';

interface QuestionManagerProps {
  quizId: string;
}

export function QuestionManager({ quizId }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const handleQuestionAdded = () => {
    fetchQuestions(); // Refetch to get the latest state from the DB
    setIsModalOpen(false);
  };
  
  // --- NEW LOGIC ---
  // Find the most recent video_url from the existing questions.
  const lastVideoUrl = useMemo(() => {
      const questionsWithVideos = [...questions]
        .filter(q => q.video_url)
        .sort((a,b) => b.order_num - a.order_num);
      return questionsWithVideos[0]?.video_url || '';
  }, [questions]);
  
  const nextOrderNum = useMemo(() => {
      if (questions.length === 0) return 0;
      return Math.max(...questions.map(q => q.order_num)) + 1;
  }, [questions]);
  // --- END NEW LOGIC ---

  if (loading) return <div>Loading questions...</div>;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Manage Questions</h2>
        <Button onClick={() => setIsModalOpen(true)}>Add New Question</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddQuestionForm
          quizId={quizId}
          onQuestionAdded={handleQuestionAdded}
          onCancel={() => setIsModalOpen(false)}
          nextOrderNum={nextOrderNum}
          lastVideoUrl={lastVideoUrl} // Pass the last video URL to the form
        />
      </Modal>

      <div className="space-y-4">
        {/* Render logic remains the same... */}
      </div>
    </div>
  );
}


/*
* FILE: src/components/admin/AddQuestionForm.tsx
* This form now has a button to reuse the last video URL.
*/
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QuizQuestion } from '@/types/quiz';
// Make sure to have these UI components
// import { Input } from '@/components/ui/Input';
// import Button from '@/components/ui/Button';

// Zod schema for the form
const formSchema = z.object({
  question_text: z.string().min(1, 'Question text is required.'),
  video_url: z.string().optional(),
  // ... other fields
  options: z.array(z.object({
      option_text: z.string().min(1, 'Option text cannot be empty.'),
      is_correct: z.boolean(),
  })).min(2, 'Must have at least two options.'),
});

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: QuizQuestion) => void;
  onCancel: () => void;
  nextOrderNum: number;
  lastVideoUrl: string; // New prop
}

export default function AddQuestionForm({ quizId, onQuestionAdded, onCancel, nextOrderNum, lastVideoUrl }: AddQuestionFormProps) {
    const { register, handleSubmit, control, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            question_text: '',
            video_url: '',
            options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }]
        }
    });
    
    const { fields, append, remove } = useFieldArray({ control, name: "options" });

    const onSubmit = async (data: any) => {
        const payload = {
            ...data,
            quiz_id: quizId,
            order_num: nextOrderNum,
            // ... other default values
        };

        const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const newQuestion = await response.json();
            onQuestionAdded(newQuestion);
        } else {
            // Handle error
            console.error("Failed to add question");
        }
    };
    
    // --- NEW FUNCTION ---
    const handleUseLastVideo = () => {
        if(lastVideoUrl) {
            setValue('video_url', lastVideoUrl);
        }
    }
    // --- END NEW FUNCTION ---

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ... other form fields for question_text, etc. ... */}

            <div className="flex items-center space-x-2">
                <input {...register('video_url')} placeholder="Video URL (optional)" className="border p-2 rounded w-full" />
                {lastVideoUrl && (
                     <Button type="button" onClick={handleUseLastVideo} className="flex-shrink-0">
                         Use Last Video
                     </Button>
                )}
            </div>
            
            {/* ... options mapping and other form elements ... */}

            <div className="flex justify-end space-x-2">
                <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
                <Button type="submit">Add Question</Button>
            </div>
        </form>
    );
}
