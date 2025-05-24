'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TrashIcon } from '@heroicons/react/24/outline'; // <<< ADDED IMPORT

interface AddQuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: any) => void;
  onCancel: () => void;
  nextOrderNum: number;
}

interface OptionState {
  id: string;
  option_text: string;
  is_correct: boolean;
}

export default function AddQuestionForm({ quizId, onQuestionAdded, onCancel, nextOrderNum }: AddQuestionFormProps) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false'>('multiple-choice');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(2);
  const [orderNum, setOrderNum] = useState(nextOrderNum);

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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-gray-50">
      {/* <Input type="hidden" value={orderNum} /> */} {/* Not displayed but used */}
      <div>
        <label htmlFor="questionTextAdmin" className="block text-sm font-medium text-gray-7