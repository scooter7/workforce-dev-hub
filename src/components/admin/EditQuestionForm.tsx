'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TrashIcon } from '@heroicons/react/24/outline';
import { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz';

interface EditQuestionFormProps {
  quizId: string;
  questionData: QuizQuestion; // Initial question data to edit
}

interface OptionState {
  id: string; // Can be existing DB ID or new temporary client-side ID
  option_text: string;
  is_correct: boolean;
  // We might add a flag to mark options for deletion or new for more granular updates,
  // but for simplicity, we'll replace all options on update for now.
}

const mediaPositionOptions: { value: MediaPosition; label: string }[] = [
  { value: 'above_text', label: 'Above Question Text' },
  { value: 'below_text', label: 'Below Question Text' },
  { value: 'left_of_text', label: 'Left of Question Text' },
  { value: 'right_of_text', label: 'Right of Question Text' },
];

export default function EditQuestionForm({ quizId, questionData }: EditQuestionFormProps) {
  const router = useRouter();

  const [questionText, setQuestionText] = useState(questionData.question_text);
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false'>(questionData.question_type);
  const [explanation, setExplanation] = useState(questionData.explanation || '');
  const [points, setPoints] = useState(questionData.points);
  const [orderNum, setOrderNum] = useState(questionData.order_num); // Order num might not be editable here directly

  const [imageUrl, setImageUrl] = useState(questionData.image_url || '');
  const [videoEmbedCode, setVideoEmbedCode] = useState(questionData.video_url || ''); // video_url stores embed code
  const [mediaPosition, setMediaPosition] = useState<MediaPosition>(questionData.media_position || 'above_text');

  const [options, setOptions] = useState<OptionState[]>(
    questionData.options.map(opt => ({ ...opt })) || // Ensure to map to OptionState if structure differs
    (questionData.question_type === 'true-false' && questionData.options.length === 0 ? 
        [ // Default options for true-false if none exist
            { id: crypto.randomUUID(), option_text: 'True', is_correct: false },
            { id: crypto.randomUUID(), option_text: 'False', is_correct: false },
        ] :
        [ // Default for new multiple-choice
            { id: crypto.randomUUID(), option_text: '', is_correct: true },
            { id: crypto.randomUUID(), option_text: '', is_correct: false },
        ]
    )
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-populate form when questionData changes (e.g., if this component was reused without full remount)
  useEffect(() => {
    setQuestionText(questionData.question_text);
    setQuestionType(questionData.question_type);
    setExplanation(questionData.explanation || '');
    setPoints(questionData.points);
    setOrderNum(questionData.order_num);
    setImageUrl(questionData.image_url || '');
    setVideoEmbedCode(questionData.video_url || '');
    setMediaPosition(questionData.media_position || 'above_text');
    setOptions(questionData.options.map(opt => ({ ...opt })) || 
        (questionData.question_type === 'true-false' && questionData.options.length === 0 ? 
            [
                { id: crypto.randomUUID(), option_text: 'True', is_correct: false },
                { id: crypto.randomUUID(), option_text: 'False', is_correct: false },
            ] :
             [
                { id: crypto.randomUUID(), option_text: '', is_correct: true },
                { id: crypto.randomUUID(), option_text: '', is_correct: false },
            ]
        )
    );
  }, [questionData]);


  const handleOptionChange = (index: number, field: keyof OptionState, value: string | boolean) => {
    setOptions(currentOptions => {
        let newOptions = currentOptions.map((opt, i) => {
            if (i === index) { return { ...opt, [field]: value }; }
            return opt;
        });
        if (questionType === 'multiple-choice' && field === 'is_correct' && value === true) {
            newOptions = newOptions.map((opt, i) => ({...opt, is_correct: i === index}));
        } else if (questionType === 'true-false' && field === 'is_correct' && value === true) {
            // For true/false, ensure only one can be correct
            newOptions = newOptions.map((opt, i) => ({...opt, is_correct: i === index}));
        }
        return newOptions;
    });
  };

  const addOption = () => {
    if (questionType === 'multiple-choice' && options.length < 6) {
      setOptions(prevOptions => [...prevOptions, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (questionType === 'multiple-choice' && options.length > 2) { 
      setOptions(prevOptions => {
          const newOptions = prevOptions.filter((_, i) => i !== index);
          if (!newOptions.some(opt => opt.is_correct) && newOptions.length > 0) {
              newOptions[0].is_correct = true;
          }
          return newOptions;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!questionText.trim()) { setError("Question text required."); setIsLoading(false); return; }
    if (imageUrl && videoEmbedCode) { setError("Provide image URL or video embed, not both."); setIsLoading(false); return; }

    let finalOptionsPayload: Array<Omit<QuestionOption, 'id' | 'question_id'>> = [];
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
        finalOptionsPayload = options
            .filter(opt => opt.option_text.trim() !== '')
            .map(({ option_text, is_correct }) => ({ option_text, is_correct }));
        if (finalOptionsPayload.length < 2) { setError(`${questionType === 'true-false' ? 'True/False' : 'Multiple-choice'} questions need >= 2 options.`); setIsLoading(false); return; }
        if (!finalOptionsPayload.some(opt => opt.is_correct)) { setError("One option must be correct."); setIsLoading(false); return; }
    }

    const payload = {
      question_text: questionText.trim(),
      question_type: questionType,
      explanation: explanation.trim() || null,
      points: Number(points),
      order_num: Number(orderNum), // Usually order_num is managed on the parent "Manage Questions" page via drag/drop or reorder buttons
      image_url: imageUrl.trim() || null,
      video_url: videoEmbedCode.trim() || null,
      media_position: (imageUrl.trim() || videoEmbedCode.trim()) ? mediaPosition : null,
      options: finalOptionsPayload,
    };

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions/${questionData.id}`, {
        method: 'PATCH', // Or PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || `Failed to update question (Status: ${response.status})`);
      }
      setSuccessMessage('Question updated successfully!');
      // Optionally, redirect or call a prop function to update parent list
      // router.push(`/admin/quizzes/${quizId}/manage`); // Example redirect
      router.refresh(); // Refresh current page data if staying
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      <p className="text-sm text-gray-500">Editing Question (Order: {orderNum})</p>
      <div>
        <label htmlFor="editQuestionText" className="block text-sm font-medium text-gray-700 mb-1">Question Text <span className="text-red-500">*</span></label>
        <textarea id="editQuestionText" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} required className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="editQuestionType" className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select id="editQuestionType" value={questionType} 
                onChange={(e) => {
                    const newType = e.target.value as 'multiple-choice' | 'true-false';
                    setQuestionType(newType);
                    if (newType === 'true-false') {
                        // Set default T/F options if not already, or if options are unsuitable
                        const hasTrue = options.some(o => o.option_text.toLowerCase() === 'true');
                        const hasFalse = options.some(o => o.option_text.toLowerCase() === 'false');
                        if (!hasTrue || !hasFalse || options.length !== 2) {
                            setOptions([
                                { id: crypto.randomUUID(), option_text: 'True', is_correct: true },
                                { id: crypto.randomUUID(), option_text: 'False', is_correct: false },
                            ]);
                        }
                    } else if (options.length < 2) { // For multiple-choice, ensure at least 2 blank options
                        setOptions([
                            { id: crypto.randomUUID(), option_text: '', is_correct: true },
                            { id: crypto.randomUUID(), option_text: '', is_correct: false },
                        ]);
                    }
                }} 
                className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
            </select>
        </div>
        <div>
            <label htmlFor="editPoints" className="block text-sm font-medium text-gray-700 mb-1">Points</label>
            <Input type="number" id="editPoints" value={points.toString()} onChange={(e) => setPoints(parseInt(e.target.value,10) || 0)} min="0" required className="mt-1" disabled={isLoading}/>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-md space-y-4">
        <h3 className="text-md font-medium text-gray-700">Optional Media</h3>
        <div>
            <label htmlFor="editImageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input type="url" id="editImageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="mt-1" disabled={isLoading || !!videoEmbedCode}/>
            {!!videoEmbedCode && <p className="text-xs text-gray-500 mt-1">Clear video embed to use image URL.</p>}
        </div>
        <div>
            <label htmlFor="editVideoEmbed" className="block text-sm font-medium text-gray-700 mb-1">Video Embed Code</label>
            <textarea id="editVideoEmbed" value={videoEmbedCode} onChange={(e) => setVideoEmbedCode(e.target.value)} rows={4}
                placeholder='<iframe src="youtube.com/embed/VIDEO_ID3" ...></iframe>'
                className="mt-1 block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm placeholder-gray-400" 
                disabled={isLoading || !!imageUrl}/>
            {!!imageUrl && <p className="text-xs text-gray-500 mt-1">Clear image URL to use video embed.</p>}
        </div>
        {(imageUrl || videoEmbedCode) && (
            <div>
                <label htmlFor="editMediaPosition" className="block text-sm font-medium text-gray-700 mb-1">Media Position</label>
                <select id="editMediaPosition" value={mediaPosition} onChange={(e) => setMediaPosition(e.target.value as MediaPosition)} className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}>
                    {mediaPositionOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
            </div>
        )}
      </div>
      
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium text-gray-700 px-1">Answer Options</legend>
        <div className="space-y-3 mt-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Input type="text" aria-label={`Option ${index + 1} text`} placeholder={`Option ${index + 1}`} 
                     value={option.option_text} 
                     onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)} 
                     className="flex-grow" 
                     disabled={isLoading || (questionType === 'true-false')}
              />
              <input type="radio" id={`editCorrectOption-${option.id}`} name={`editCorrectOptionRadioGroup-${questionData.id}`} 
                     checked={option.is_correct} 
                     onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)} 
                     className="h-5 w-5 text-brand-primary focus:ring-brand-primary" 
                     disabled={isLoading}
              />
              <label htmlFor={`editCorrectOption-${option.id}`} className="text-sm text-gray-700 cursor-pointer">Correct</label>
              {questionType === 'multiple-choice' && options.length > 2 && (
                <Button type="button" variant="danger" size="sm" onClick={() => removeOption(index)} className="p-1.5" disabled={isLoading} aria-label="Remove option"><TrashIcon className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
        </div>
        {questionType === 'multiple-choice' && options.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-3" disabled={isLoading}>Add Option</Button>
        )}
      </fieldset>

      <div>
        <label htmlFor="editExplanation" className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
        <textarea id="editExplanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}/>
      </div>

      {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-md text-center">{error}</p>}
      {successMessage && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">{successMessage}</p>}
      
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.push(`/admin/quizzes/${quizId}/manage`)} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </form>
  );
}