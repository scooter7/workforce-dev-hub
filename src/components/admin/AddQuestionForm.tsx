'use client';

import { useState, FormEvent, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TrashIcon } from '@heroicons/react/24/outline';
import { QuizQuestion, MediaPosition } from '@/types/quiz';

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: QuizQuestion) => void;
  onCancel: () => void;
  nextOrderNum: number;
}

interface OptionState {
  id: string;
  option_text: string;
  is_correct: boolean;
}

// Type for the options structure expected by the API payload
type OptionForPayload = {
  option_text: string;
  is_correct: boolean;
};

const mediaPositionOptions: { value: MediaPosition; label: string }[] = [
  { value: 'above_text', label: 'Above Question Text' },
  { value: 'below_text', label: 'Below Question Text' },
];

export default function AddQuestionForm({
  quizId,
  onQuestionAdded,
  onCancel,
  nextOrderNum,
}: AddQuestionFormProps) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false'>('multiple-choice');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(2);
  const [orderNum, setOrderNum] = useState(nextOrderNum);
  const [imageUrl, setImageUrl] = useState('');
  const [videoEmbedCode, setVideoEmbedCode] = useState('');
  const [mediaPosition, setMediaPosition] = useState<MediaPosition>('above_text');
  const [options, setOptions] = useState<OptionState[]>([
    { id: crypto.randomUUID(), option_text: '', is_correct: true },
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrderNum(nextOrderNum);
    if (questionType === 'true-false') {
        setOptions([
            { id: crypto.randomUUID(), option_text: 'True', is_correct: true },
            { id: crypto.randomUUID(), option_text: 'False', is_correct: false },
        ]);
    } else {
        if (options.filter(opt => opt.is_correct).length !== 1) {
            const newOptions = options.map((opt, idx) => ({ ...opt, is_correct: idx === 0 }));
            setOptions(newOptions.length >= 2 ? newOptions : [
                { id: crypto.randomUUID(), option_text: '', is_correct: true },
                { id: crypto.randomUUID(), option_text: '', is_correct: false },
            ]);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextOrderNum, questionType]); // options removed to prevent loop, managed explicitly

  const handleOptionChange = (index: number, field: keyof OptionState, value: string | boolean) => {
    setOptions(currentOptions => {
        let newOptions = currentOptions.map((opt, i) => {
            if (i === index) {
                return { ...opt, [field]: value };
            }
            return opt;
        });
        if (questionType === 'multiple-choice' && field === 'is_correct' && value === true) {
            newOptions = newOptions.map((opt, i) => ({...opt, is_correct: i === index}));
        }
        return newOptions;
    });
  };

  const addOption = () => {
    if (options.length < 6 && questionType === 'multiple-choice') { // Only add for multiple-choice
      setOptions(prevOptions => [...prevOptions, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);
    }
  };

  const removeOption = (index: number) => {
    // Allow removing options for multiple-choice down to 2
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

  const resetFormFields = () => {
    setQuestionText(''); setExplanation(''); setPoints(2);
    setOrderNum(prev => prev + 1);
    setImageUrl(''); setVideoEmbedCode(''); setMediaPosition('above_text');
    setQuestionType('multiple-choice');
    setOptions([
        { id: crypto.randomUUID(), option_text: '', is_correct: true },
        { id: crypto.randomUUID(), option_text: '', is_correct: false },
    ]);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true); setError(null);

    if (!questionText.trim()) { setError("Question text is required."); setIsLoading(false); return; }
    if (imageUrl && videoEmbedCode) { setError("Use either an image URL or video embed, not both."); setIsLoading(false); return; }

    let finalOptionsPayload: OptionForPayload[] = []; // <<< EXPLICITLY TYPED HERE

    if (questionType === 'multiple-choice') {
        finalOptionsPayload = options
            .filter(opt => opt.option_text.trim() !== '')
            .map(({ option_text, is_correct }) => ({ option_text, is_correct }));
        if (finalOptionsPayload.length < 2) { setError("Multiple-choice questions need at least two filled options."); setIsLoading(false); return; }
        if (!finalOptionsPayload.some(opt => opt.is_correct)) { setError("For multiple choice, one option must be marked correct."); setIsLoading(false); return; }
    } else if (questionType === 'true-false') {
        // Ensure "True" and "False" options are what's being submitted from state
        finalOptionsPayload = options.map(({ option_text, is_correct }) => ({ option_text, is_correct }));
        if (finalOptionsPayload.length !== 2 || 
            !finalOptionsPayload.find(o => o.option_text.toLowerCase() === 'true') ||
            !finalOptionsPayload.find(o => o.option_text.toLowerCase() === 'false') ||
            !finalOptionsPayload.some(opt => opt.is_correct)) {
            setError("True/False questions must have 'True' and 'False' options, with one marked correct.");
            setIsLoading(false); return;
        }
    }

    const payload = {
      question_text: questionText.trim(), question_type: questionType,
      explanation: explanation.trim() || null, points: Number(points), order_num: Number(orderNum),
      image_url: imageUrl.trim() || null, video_url: videoEmbedCode.trim() || null,
      media_position: (imageUrl.trim() || videoEmbedCode.trim()) ? mediaPosition : null,
      options: finalOptionsPayload,
    };

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || `Failed to add question (Status: ${response.status})`);
      }
      onQuestionAdded(result.question as QuizQuestion);
      resetFormFields();
    } catch (err: any) { setError(err.message || 'An unexpected error occurred.');
    } finally { setIsLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      <p className="text-sm text-gray-500">Adding Question #{orderNum}</p>
      <div>
        <label htmlFor="questionTextAdmin" className="block text-sm font-medium text-gray-700 mb-1">Question Text <span className="text-red-500">*</span></label>
        <textarea id="questionTextAdmin" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} required className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="questionTypeAdmin" className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select id="questionTypeAdmin" value={questionType} 
                onChange={(e) => {
                    const newType = e.target.value as 'multiple-choice' | 'true-false';
                    setQuestionType(newType);
                    if (newType === 'true-false') {
                        setOptions([
                            { id: crypto.randomUUID(), option_text: 'True', is_correct: true }, // Default True to correct
                            { id: crypto.randomUUID(), option_text: 'False', is_correct: false },
                        ]);
                    } else {
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
            <label htmlFor="pointsAdmin" className="block text-sm font-medium text-gray-700 mb-1">Points</label>
            <Input type="number" id="pointsAdmin" value={points.toString()} onChange={(e) => setPoints(parseInt(e.target.value,10) || 0)} min="0" required className="mt-1" disabled={isLoading}/>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-md space-y-4">
        <h3 className="text-md font-medium text-gray-700">Optional Media</h3>
        <div>
            <label htmlFor="imageUrlAdmin" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input type="url" id="imageUrlAdmin" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="mt-1" disabled={isLoading || !!videoEmbedCode}/>
            {!!videoEmbedCode && <p className="text-xs text-gray-500 mt-1">Clear video embed to use image URL.</p>}
        </div>
        <div>
            <label htmlFor="videoEmbedAdmin" className="block text-sm font-medium text-gray-700 mb-1">Video Embed Code</label>
            <textarea id="videoEmbedAdmin" value={videoEmbedCode} onChange={(e) => setVideoEmbedCode(e.target.value)} rows={4}
                placeholder='<iframe src="youtube.com/embed/VIDEO_ID2" ...></iframe>'
                className="mt-1 block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm placeholder-gray-400" 
                disabled={isLoading || !!imageUrl}/>
            {!!imageUrl && <p className="text-xs text-gray-500 mt-1">Clear image URL to use video embed.</p>}
        </div>
        {(imageUrl || videoEmbedCode) && (
            <div>
                <label htmlFor="mediaPositionAdmin" className="block text-sm font-medium text-gray-700 mb-1">Media Position</label>
                <select id="mediaPositionAdmin" value={mediaPosition} onChange={(e) => setMediaPosition(e.target.value as MediaPosition)} className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}>
                    {mediaPositionOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
            </div>
        )}
      </div>
      
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium text-gray-700 px-1">Answer Options ({questionType === 'true-false' ? 'Set Correct T/F' : 'Multiple Choice'})</legend>
        <div className="space-y-3 mt-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Input type="text" aria-label={`Option ${index + 1} text`} placeholder={`Option ${index + 1}`} 
                     value={option.option_text} 
                     onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)} 
                     className="flex-grow" 
                     disabled={isLoading || (questionType === 'true-false')} // Also disable text edit for T/F
              />
              <input type="radio" id={`correctOption-${option.id}`} name={`correctOptionRadioGroup-${quizId}-${orderNum}`} 
                     checked={option.is_correct} 
                     onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)} 
                     className="h-5 w-5 text-brand-primary focus:ring-brand-primary" 
                     disabled={isLoading}
              />
              <label htmlFor={`correctOption-${option.id}`} className="text-sm text-gray-700 cursor-pointer">Correct</label>
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