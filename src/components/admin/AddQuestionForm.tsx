'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: any) => void; // Adjust 'any' based on actual API response
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

  // For multiple-choice options
  const [options, setOptions] = useState<OptionState[]>([
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
    { id: crypto.randomUUID(), option_text: '', is_correct: false },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, field: keyof OptionState, value: string | boolean) => {
    const newOptions = [...options];
    // @ts-ignore
    newOptions[index][field] = value;
    // If setting an option to correct for multiple choice, ensure only one is correct (if radio button style)
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
        ? options.filter(opt => opt.option_text.trim()).map(({option_text, is_correct}) => ({option_text, is_correct})) // Don't send client ID
        : [], // No options for true-false from this form structure yet
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

      onQuestionAdded(result.question); // Assuming API returns the created question
      // Reset form fields
      setQuestionText('');
      setExplanation('');
      setPoints(2);
      setOrderNum(prev => prev + 1); // Increment for next potential question
      setOptions([{ id: crypto.randomUUID(), option_text: '', is_correct: false }, { id: crypto.randomUUID(), option_text: '', is_correct: false }]);


    } catch (err: any) {
      console.error('Add question error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      <Input type="hidden" value={orderNum} /> {/* Could display or make editable */}
      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-1">Question Text <span className="text-red-500">*</span></label>
        <textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3} required
          className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select id="questionType" value={questionType} onChange={(e) => setQuestionType(e.target.value as any)} className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm sm:text-sm">
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False (Options not applicable yet)</option>
            </select>
        </div>
        <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">Points</label>
            <Input type="number" id="points" value={points} onChange={(e) => setPoints(parseInt(e.target.value,10))} min="0" required className="mt-1"/>
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
                  placeholder={`Option ${index + 1}`}
                  value={option.option_text}
                  onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                  className="flex-grow"
                />
                <input
                  type="radio" // Using radio to enforce single correct answer
                  name={`correctOption-${quizId}`} // Group radios for this question
                  checked={option.is_correct}
                  onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                  className="h-5 w-5 text-brand-primary focus:ring-brand-primary"
                  title="Mark as correct"
                />
                 <label htmlFor={`correct-${option.id}`} className="text-sm">Correct</label>
                {options.length > 2 && (
                  <Button type="button" variant="danger" size="sm" onClick={() => removeOption(index)} className="p-1.5">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-3">
              Add Option
            </Button>
          )}
        </fieldset>
      )}

      <div>
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
        <textarea id="explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm sm:text-sm"/>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
}