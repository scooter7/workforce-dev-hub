'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import type { QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// Zod schema for the edit form
const formSchema = z.object({
  question_text: z.string().min(1, 'Question text is required.'),
  explanation: z.string().optional().nullable(),
  points: z.coerce.number().int().min(0),
  video_url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  media_position: z.enum(['above_text', 'below_text', 'left_of_text', 'right_of_text']).default('above_text'),
  options: z.array(z.object({
    id: z.string().uuid().optional(),
    option_text: z.string().min(1, 'Option text is required.'),
    is_correct: z.boolean(),
  })).min(2, 'Must have at least two options.')
     .refine(opts => opts.some(opt => opt.is_correct), { message: 'One option must be correct.' }),
}).refine(data => !data.video_url || !data.image_url, {
    message: "Use either a video or an image, not both.",
    path: ["video_url"],
});

type FormData = z.infer<typeof formSchema>;

interface EditQuestionFormProps {
  quizId: string;
  question: QuizQuestion;
}

export default function EditQuestionForm({ quizId, question }: EditQuestionFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: question.question_text,
      explanation: question.explanation,
      points: question.points,
      video_url: question.video_url,
      image_url: question.image_url,
      media_position: question.media_position || 'above_text',
      options: question.options,
    },
  });
  
  const videoUrlValue = watch("video_url");
  const imageUrlValue = watch("image_url");

  const options = watch('options');

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update question');
      }
      
      router.push(`/admin/quizzes/${quizId}/manage`);
      router.refresh();

    } catch (error: any) {
      console.error("Update Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
      <h2 className="text-2xl font-bold">Edit Question</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Question Text</label>
        <Input {...register('question_text')} />
        {errors.question_text && <p className="text-red-500 text-sm mt-1">{errors.question_text.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Video URL (Optional)</label>
        <Input {...register('video_url')} placeholder="https://youtube.com/..." disabled={!!imageUrlValue} />
        {errors.video_url && <p className="text-red-500 text-sm mt-1">{errors.video_url.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Or Image URL (Optional)</label>
        <Input {...register('image_url')} placeholder="https://..." disabled={!!videoUrlValue} />
        {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url.message}</p>}
      </div>

      <div>
          <label className="block text-sm font-medium mb-1">Options</label>
          {options.map((field, index) => (
            <div key={field.id || index} className="flex items-center space-x-2 mb-2">
                <Input {...register(`options.${index}.option_text`)} />
                <label className="flex items-center space-x-2">
                    <input 
                        type="radio" 
                        name="correct_option_group"
                        defaultChecked={field.is_correct}
                        onChange={() => {
                            options.forEach((_opt, i) => {
                                setValue(`options.${i}.is_correct`, i === index);
                            });
                        }}
                    />
                    <span>Correct</span>
                </label>
            </div>
          ))}
          {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options.root?.message}</p>}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
        <Button type="button" onClick={() => router.back()} variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
