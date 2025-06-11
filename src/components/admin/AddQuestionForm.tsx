'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QuizQuestion } from '@/types/quiz';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
}).refine(data => !data.video_url || !data.image_url, {
    message: "Provide either a video URL or an image URL, not both.",
    path: ["video_url"], // Attach the error message to the video_url field
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
    watch,
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
  
  const videoUrlValue = watch("video_url");
  const imageUrlValue = watch("image_url");

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      order_num: nextOrderNum,
      question_type: 'multiple-choice',
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
      setValue('image_url', '', { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
      <h3 className="text-xl font-semibold">Add New Question (Order: {nextOrderNum})</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Question Text</label>
        <Input {...register('question_text')} />
        {errors.question_text && <p className="text-red-500 text-sm mt-1">{errors.question_text.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Video URL (Optional)</label>
        <div className="flex items-center space-x-2">
            <Input {...register('video_url')} placeholder="https://youtube.com/..." disabled={!!imageUrlValue}/>
            {lastVideoUrl && (
                <Button type="button" onClick={handleUseLastVideo} variant="outline" className="flex-shrink-0">
                    Use Last Video
                </Button>
            )}
        </div>
         {errors.video_url && <p className="text-red-500 text-sm mt-1">{errors.video_url.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Or Image URL (Optional)</label>
        <Input {...register('image_url')} placeholder="https://..." disabled={!!videoUrlValue} />
        {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url.message}</p>}
      </div>

      <div>
          <label className="block text-sm font-medium mb-1">Options</label>
          {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2 mb-2">
                  <Input {...register(`options.${index}.option_text`)} placeholder={`Option ${index + 1}`} />
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" {...register('options')} name="correct_option_group" value={index.toString()} onChange={() => {
                          fields.forEach((_f, i) => setValue(`options.${i}.is_correct`, i === index));
                      }} defaultChecked={field.is_correct} className="h-4 w-4"/>
                      <span>Correct</span>
                  </label>
                  {fields.length > 2 && <Button type="button" onClick={() => remove(index)} variant="outline" size="sm">X</Button>}
              </div>
          ))}
          <Button type="button" onClick={() => append({ option_text: '', is_correct: false })}>Add Option</Button>
          {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options.root?.message || errors.options.message}</p>}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
        <Button type="button" onClick={onCancel} variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Question'}
        </Button>
      </div>
    </form>
  );
}
