'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input'; // Assuming Input handles text, url, number types
import { TrashIcon } from '@heroicons/react/24/outline';
import { QuizQuestion, MediaPosition } from '@/types/quiz'; // Import MediaPosition

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: QuizQuestion) => void; // Expecting the full QuizQuestion type
  onCancel: () => void;
  nextOrderNum: number;
  // initialData?: Partial<QuizQuestion>; // For future edit functionality
}

interface OptionState {
  id: string; // Temporary client-side ID for list key
  option_text: string;
  is_correct: boolean;
}

const mediaPositionOptions: { value: MediaPosition; label: string }[] = [
  { value: 'above_text', label: 'Above Question Text' },
  { value: 'below_text', label: 'Below Question Text' },
  // Add 'left_of_text', 'right_of_text' when/if you implement more complex layouts in QuizPlayer
];

export default function AddQuestionForm({
  quizId,
  onQuestionAdded,
  onCancel,
  nextOrderNum,
  // initialData // For future edit
}: AddQuestionFormProps) {
  // const isEditMode = Boolean(initialData?.id); // For future edit

  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false'>('multiple-choice');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(2);
  const [orderNum, setOrderNum] = useState(nextOrderNum);

  // New state for media fields
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaPosition, setMediaPosition] = useState<MediaPosition>('above_text');

  const [options, setOptions] = useState<OptionState[]>([
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to reset form when nextOrderNum changes (e.g., after adding a question)
  // or when initialData would change for an edit form
  useEffect(() => {
    setOrderNum(nextOrderNum);
    // If implementing edit mode, you'd populate all fields from initialData here
  }, [nextOrderNum]);


  const handleOptionChange = (index: number, field: keyof OptionState, value: string | boolean) => {
    const newOptions = [...options];
    // @ts-ignore TypeScript might struggle with assigning to a dynamic field here without more complex types
    newOptions[index][field] = value;
    if (field === 'is_correct' && value === true && questionType === 'multiple-choice') {
        newOptions.forEach((opt, i) => {
            if (i !== index) opt.is_correct = false;
        });
    }
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(newOptions => newOptions.filter((_, i) => i !== index));
    }
  };

  const resetFormFields = () => {
    setQuestionText('');
    setExplanation('');
    setPoints(2); // Reset to default
    setOrderNum(prev => prev + 1); // Increment for next potential question
    setOptions([{ id: crypto.randomUUID(), option_text: '', is_correct: false }, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);
    setImageUrl('');
    setVideoUrl('');
    setMediaPosition('above_text');
    // setQuestionType('multiple-choice'); // Optionally reset type or keep user's last selection
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!questionText.trim()) {
      setError("Question text is required."); setIsLoading(false); return;
    }
    if (questionType === 'multiple-choice' && options.filter(opt => opt.option_text.trim()).length < 2) {
      setError("Multiple-choice questions require at least two options with text."); setIsLoading(false); return;
    }
    if (questionType === 'multiple-choice' && !options.some(opt => opt.is_correct)) {
        setError("One option must be marked as correct for multiple-choice questions."); setIsLoading(false); return;
    }
    if (imageUrl && videoUrl) {
        setError("Please provide either an image URL or a video URL, not both."); setIsLoading(false); return;
    }

    const payload = {
      question_text: questionText.trim(),
      question_type: questionType,
      explanation: explanation.trim() || null,
      points: Number(points),
      order_num: Number(orderNum),
      image_url: imageUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      media_position: (imageUrl.trim() || videoUrl.trim()) ? mediaPosition : null, // Only send position if media exists
      options: questionType === 'multiple-choice'
        ? options.filter(opt => opt.option_text.trim()).map(({option_text, is_correct}) => ({option_text, is_correct}))
        : [],
    };

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json(); // Assuming result includes { message: string, question: QuizQuestion }
      if (!response.ok) {
        throw new Error(result.error || `Failed to add question (Status: ${response.status})`);
      }
      onQuestionAdded(result.question as QuizQuestion); // Pass the full question object back
      resetFormFields();
    } catch (err: any) {
      console.error('Add question error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      <Input type="hidden" value={orderNum.toString()} name="orderNumInternal" />
      <div>
        <label htmlFor="questionTextAdmin" className="block text-sm font-medium text-gray-700 mb-1">Question Text <span className="text-red-500">*</span></label>
        <textarea id="questionTextAdmin" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} required className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="questionTypeAdmin" className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select id="questionTypeAdmin" value={questionType} onChange={(e) => setQuestionType(e.target.value as 'multiple-choice' | 'true-false')} className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
            </select>
        </div>
        <div>
            <label htmlFor="pointsAdmin" className="block text-sm font-medium text-gray-700 mb-1">Points</label>
            <Input type="number" id="pointsAdmin" value={points.toString()} onChange={(e) => setPoints(parseInt(e.target.value,10) || 0)} min="0" required className="mt-1" disabled={isLoading}/>
        </div>
      </div>

      {/* Media Fields */}
      <div className="p-4 border border-gray-200 rounded-md space-y-4">
        <h3 className="text-md font-medium text-gray-700">Optional Media</h3>
        <div>
            <label htmlFor="imageUrlAdmin" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input type="url" id="imageUrlAdmin" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="mt-1" disabled={isLoading || !!videoUrl}/>
            {!!videoUrl && <p className="text-xs text-gray-500 mt-1">Clear video URL to use image URL.</p>}
        </div>
        <div>
            <label htmlFor="videoUrlAdmin" className="block text-sm font-medium text-gray-700 mb-1">Video URL (e.g., YouTube embed)</label>
            <Input type="url" id="videoUrlAdmin" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/your_video_id" className="mt-1" disabled={isLoading || !!imageUrl}/>
            {!!imageUrl && <p className="text-xs text-gray-500 mt-1">Clear image URL to use video URL.</p>}
        </div>
        {(imageUrl || videoUrl) && (
            <div>
                <label htmlFor="mediaPositionAdmin" className="block text-sm font-medium text-gray-700 mb-1">Media Position</label>
                <select id="mediaPositionAdmin" value={mediaPosition} onChange={(e) => setMediaPosition(e.target.value as MediaPosition)} className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}>
                    {mediaPositionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        )}
      </div>
      
      {questionType === 'multiple-choice' && (
        <fieldset className="border p-4 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">Answer Options</legend>
          <div className="space-y-3 mt-2">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Input type="text" aria-label={`Option ${index + 1} text`} placeholder={`Option ${index + 1}`} value={option.option_text} onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)} className="flex-grow" disabled={isLoading}/>
                <input type="radio" id={`correctOption-${option.id}`} name={`correctOptionRadioGroup-${quizId}-${orderNum}`} checked={option.is_correct} onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)} className="h-5 w-5 text-brand-primary focus:ring-brand-primary" disabled={isLoading}/>
                <label htmlFor={`correctOption-${option.id}`} className="text-sm text-gray-700 cursor-pointer">Correct</label>
                {options.length > 2 && (
                  <Button type="button" variant="danger" size="sm" onClick={() => removeOption(index)} className="p-1.5" disabled={isLoading} aria-label="Remove option"><TrashIcon className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (<Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-3" disabled={isLoading}>Add Option</Button>)}
        </fieldset>
      )}

      <div>
        <label htmlFor="explanationAdmin" className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
        <textarea id="explanationAdmin" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}/>
      </div>

      {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-md text-center">{error}</p>}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Adding...' : 'Add Question'}</Button>
      </div>
    </form>
  );
}