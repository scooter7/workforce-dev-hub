'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Zod schema for form validation
const formSchema = z.object({
  question_text: z.string().min(1, 'Question text is required.'),
  explanation: z.string().optional(),
  points: z.coerce.number().int().min(0),
  video_url: z.string().optional(),
  image_url: z.string().optional(),
  media_position: z.enum(['above_text', 'below_text', 'left_of_text', 'right_of_text']).default('above_text'),
  options: z
    .array(
      z.object({
        option_text: z.string().min(1, 'Option text cannot be empty.'),
        is_correct: z.boolean(),
      })
    )
    .min(2, 'Must have at least two options.')
    .refine((opts) => opts.some(opt => opt.is_correct), {
        message: "At least one option must be correct."
    }),
});

type FormData = z.infer<typeof formSchema>;

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: QuizQuestion) => void;
  onCancel: () => void;
  nextOrderNum: number;
  lastVideoUrl: string;
}

export default function AddQuestionForm({
  quizId,
  onQuestionAdded,
  onCancel,
  nextOrderNum,
  lastVideoUrl,
}: AddQuestionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: '',
      explanation: '',
      points: 1,
      video_url: '',
      image_url: '',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      order_num: nextOrderNum,
      question_type: 'multiple-choice', // Assuming for now
    };

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to add question');
      }

      const newQuestion = await response.json();
      onQuestionAdded(newQuestion);
    } catch (error: any) {
      console.error("Submission Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleUseLastVideo = () => {
    if (lastVideoUrl) {
      setValue('video_url', lastVideoUrl, { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-xl font-semibold">Add New Question (Order: {nextOrderNum})</h3>
      <div>
        <label>Question Text</label>
        <Input {...register('question_text')} />
        {errors.question_text && <p className="text-red-500 text-sm">{errors.question_text.message}</p>}
      </div>
      
      <div>
        <label>Video URL</label>
        <div className="flex items-center space-x-2">
            <Input {...register('video_url')} placeholder="https://..." />
            {lastVideoUrl && (
                <Button type="button" onClick={handleUseLastVideo} variant="outline" className="flex-shrink-0">
                    Use Last
                </Button>
            )}
        </div>
        {errors.video_url && <p className="text-red-500 text-sm">{errors.video_url.message}</p>}
      </div>

      <div>
          <label>Options</label>
          {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2 mb-2">
                  <Input {...register(`options.${index}.option_text`)} placeholder={`Option ${index + 1}`} />
                  <label className="flex items-center space-x-1">
                      <input type="radio" {...register('options')} name="correct_option_group" value={index.toString()} onChange={() => {
                          fields.forEach((f, i) => {
                              setValue(`options.${i}.is_correct`, i === index);
                          })
                      }} defaultChecked={field.is_correct} />
                      <span>Correct</span>
                  </label>
                  {fields.length > 2 && <Button type="button" onClick={() => remove(index)} variant="destructive" size="sm">X</Button>}
              </div>
          ))}
          <Button type="button" onClick={() => append({ option_text: '', is_correct: false })}>Add Option</Button>
          {errors.options && <p className="text-red-500 text-sm">{errors.options.message}</p>}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
}
