'use client';

import { useState, FormEvent, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TrashIcon } from '@heroicons/react/24/outline';
import { QuizQuestion, MediaPosition } from '@/types/quiz';

// ... (interface AddQuestionFormProps, OptionState, mediaPositionOptions remain same) ...
interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: QuizQuestion) => void;
  onCancel: () => void;
  nextOrderNum: number;
}
interface OptionState { id: string; option_text: string; is_correct: boolean; }
const mediaPositionOptions: { value: MediaPosition; label: string }[] = [
  { value: 'above_text', label: 'Above Question Text' },
  { value: 'below_text', label: 'Below Question Text' },
];


export default function AddQuestionForm({ /* ...props... */ }: AddQuestionFormProps) {
  // ... (existing state for questionText, type, explanation, points, orderNum, imageUrl remain same) ...
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false'>('multiple-choice');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(2);
  const [orderNum, setOrderNum] = useState(nextOrderNum); // Passed as prop
  const [imageUrl, setImageUrl] = useState('');
  const [videoEmbedCode, setVideoEmbedCode] = useState(''); // Changed from videoUrl
  const [mediaPosition, setMediaPosition] = useState<MediaPosition>('above_text');
  const [options, setOptions] = useState<OptionState[]>([ /* ... */ ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setOrderNum(nextOrderNum); }, [nextOrderNum]);

  // ... (handleOptionChange, addOption, removeOption, resetFormFields remain largely same,
  //      ensure resetFormFields also clears videoEmbedCode) ...
  const resetFormFields = () => { /* ... clear other fields ... */ setVideoEmbedCode(''); /* ... */ };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // ... (existing validation for text, options etc. remains same) ...
    if (imageUrl && videoEmbedCode) {
        setError("Please provide either an image URL or a video embed code, not both."); 
        setIsLoading(false); return;
    }

    const payload = {
      // ... (other fields) ...
      question_text: questionText.trim(),
      question_type: questionType,
      explanation: explanation.trim() || null,
      points: Number(points),
      order_num: Number(orderNum),
      image_url: imageUrl.trim() || null,
      video_url: videoEmbedCode.trim() || null, // video_url field now sends videoEmbedCode
      media_position: (imageUrl.trim() || videoEmbedCode.trim()) ? mediaPosition : null,
      options: questionType === 'multiple-choice' 
        ? options.filter(opt => opt.option_text.trim()).map(({option_text, is_correct}) => ({option_text, is_correct}))
        : [],
    };
    // ... (fetch logic remains same) ...
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      {/* ... (questionText, type, points fields are the same) ... */}

      <div className="p-4 border border-gray-200 rounded-md space-y-4">
        <h3 className="text-md font-medium text-gray-700">Optional Media</h3>
        <div>
            <label htmlFor="imageUrlAdmin" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input type="url" id="imageUrlAdmin" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="mt-1" disabled={isLoading || !!videoEmbedCode}/>
            {!!videoEmbedCode && <p className="text-xs text-gray-500 mt-1">Clear video embed to use image URL.</p>}
        </div>
        <div>
            <label htmlFor="videoEmbedAdmin" className="block text-sm font-medium text-gray-700 mb-1">Video Embed Code (e.g., YouTube iframe)</label>
            <textarea 
                id="videoEmbedAdmin" 
                value={videoEmbedCode} 
                onChange={(e) => setVideoEmbedCode(e.target.value)} 
                rows={4}
                placeholder='<iframe width="560" height="315" src="..." title="YouTube video player" frameborder="0" allow="..."></iframe>'
                className="mt-1 block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm placeholder-gray-400" 
                disabled={isLoading || !!imageUrl}
            />
            {!!imageUrl && <p className="text-xs text-gray-500 mt-1">Clear image URL to use video embed.</p>}
        </div>
        {(imageUrl || videoEmbedCode) && ( /* ... mediaPosition select remains same ... */ )}
      </div>
      
      {/* ... (options fieldset, explanation, buttons remain same) ... */}
    </form>
  );
}