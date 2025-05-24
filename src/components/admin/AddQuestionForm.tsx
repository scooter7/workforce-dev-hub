// 'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TrashIcon } from '@heroicons/react/24/outline';

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: any) => void; // Consider defining a more specific type for newQuestion
  onCancel: () => void;
  nextOrderNum: number;
}

interface OptionState {
  id: string; // Temporary client-side ID
  option_text: string;
  is_correct: boolean;
}

export default function AddQuestionForm({ quizId, onQuestionAdded, onCancel, nextOrderNum }: AddQuestionFormProps) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false'>('multiple-choice');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(2); // Default points
  const [orderNum, setOrderNum] = useState(nextOrderNum);

  const [options, setOptions] = useState<OptionState[]>([
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, field: keyof OptionState, value: string | boolean) => {
    const newOptions = [...options];
    // @ts-ignore Will be fixed if OptionState becomes more strictly typed or field is narrowed
    newOptions[index][field] = value;
    if (field === 'is_correct' && value === true && questionType === 'multiple-choice') {
        newOptions.forEach((opt, i) => {
            if (i !== index) opt.is_correct = false;
        });
    }
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) { // Max 6 options for example
      setOptions([...options, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) { // Min 2 options
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!questionText.trim()) {
      setError("Question text is required.");
      setIsLoading(false);
      return;
    }
    if (questionType === 'multiple-choice' && options.filter(opt => opt.option_text.trim()).length < 2) {
      setError("Multiple-choice questions require at least two options with text.");
      setIsLoading(false);
      return;
    }
    if (questionType === 'multiple-choice' && !options.some(opt => opt.is_correct)) {
        setError("One option must be marked as correct for multiple-choice questions.");
        setIsLoading(false);
        return;
    }

    const payload = {
      question_text: questionText,
      question_type: questionType,
      explanation: explanation || null,
      points: Number(points),
      order_num: Number(orderNum),
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
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to add question (Status: ${response.status})`);
      }
      onQuestionAdded(result.question);
      setQuestionText('');
      setExplanation('');
      setPoints(2);
      setOrderNum(prev => prev + 1);
      setOptions([{ id: crypto.randomUUID(), option_text: '', is_correct: false }, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);
    } catch (err: any) {
      console.error('Add question error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }; // Semicolon here is fine and correct.

  return ( // This should be line 118 if counting from `'use client';` as line 1 after imports etc.
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      {/* <Input type="hidden" value={orderNum} /> */} {/* Commented out, not displayed but used in payload */}
      <div>
        <label htmlFor="questionTextAdmin" className="block text-sm font-medium text-gray-700 mb-1">Question Text <span className="text-red-500">*</span></label>
        <textarea
          id="questionTextAdmin"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3} required
          className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm"
          disabled={isLoading}
        />
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
            <Input type="number" id="pointsAdmin" value={points} onChange={(e) => setPoints(parseInt(e.target.value,10))} min="0" required className="mt-1" disabled={isLoading}/>
        </div>
      </div>

      {questionType === 'multiple-choice' && (
        <fieldset className="border p-4 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">Answer Options</legend>
          <div className="space-y-3 mt-2">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Input
                  type="text"
                  aria-label={`Option ${index + 1} text`}
                  placeholder={`Option ${index + 1}`}
                  value={option.option_text}
                  onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                  className="flex-grow"
                  disabled={isLoading}
                />
                <input
                  type="radio"
                  id={`correctOption-${option.id}`}
                  name={`correctOptionRadioGroup-${quizId}-${crypto.randomUUID()}`} // Ensure unique name for radio group per form instance
                  checked={option.is_correct}
                  onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                  className="h-5 w-5 text-brand-primary focus:ring-brand-primary"
                  disabled={isLoading}
                />
                 <label htmlFor={`correctOption-${option.id}`} className="text-sm text-gray-700 cursor-pointer">Correct</label>
                {options.length > 2 && (
                  <Button type="button" variant="danger" size="sm" onClick={() => removeOption(index)} className="p-1.5" disabled={isLoading} aria-label="Remove option">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-3" disabled={isLoading}>
              Add Option
            </Button>
          )}
        </fieldset>
      )}

      <div>
        <label htmlFor="explanationAdmin" className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
        <textarea id="explanationAdmin" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm" disabled={isLoading}/>
      </div>

      {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-md text-center">{error}</p>}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
}