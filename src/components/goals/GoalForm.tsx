'use client';

import { useState, FormEvent, useEffect } from 'react';
import { UserGoal, GoalStatus, GoalType } from '@/app/(dashboard)/goals/page'; // Import types
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface GoalFormProps {
  initialData?: Partial<UserGoal>; // For editing, pre-fill form
  onGoalAdded?: (newGoal: UserGoal) => void; // Callback after successful add
  onGoalUpdated?: (updatedGoal: UserGoal) => void; // Callback after successful update
  onCancel: () => void; // To close the form/modal
}

export default function GoalForm({
  initialData,
  onGoalAdded,
  onGoalUpdated,
  onCancel,
}: GoalFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<GoalType>(initialData?.type || 'professional');
  const [status, setStatus] = useState<GoalStatus>(initialData?.status || 'not_started');
  const [targetDate, setTargetDate] = useState(
    initialData?.target_date ? initialData.target_date.split('T')[0] : ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setType(initialData.type || 'professional');
      setStatus(initialData.status || 'not_started');
      setTargetDate(initialData.target_date ? initialData.target_date.split('T')[0] : '');
    } else {
      // Reset for "add mode" if form is reused
      setTitle('');
      setDescription('');
      setType('professional');
      setStatus('not_started');
      setTargetDate('');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError('Title is required.');
      setIsLoading(false);
      return;
    }

    // Prepare only the fields that are meant to be sent for add/update
    // For PATCH, ideally send only changed fields, but our API is set up to handle full optional updates too
    const goalDataPayload: any = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      // Status is usually set via GoalItem or defaults for new goals
      // If allowing status edit here for existing goals, ensure it's included
      status: isEditMode ? status : 'not_started',
      target_date: targetDate || null,
    };


    try {
      let response;
      let resultData;

      if (isEditMode && initialData?.id) {
        // --- EDIT MODE ---
        response = await fetch(`/api/goals/${initialData.id}`, { // General update endpoint
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalDataPayload),
        });
      } else {
        // --- ADD MODE ---
        response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalDataPayload), // `status` will be part of this
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status} ${response.statusText}` }));
        throw new Error(errData.error || `Failed to ${isEditMode ? 'update' : 'create'} goal.`);
      }

      resultData = await response.json();
      setSuccessMessage(`Goal successfully ${isEditMode ? 'updated' : 'added'}!`);


      if (isEditMode && onGoalUpdated) {
        onGoalUpdated(resultData as UserGoal); // Propagate to parent for UI update / modal close
      } else if (!isEditMode && onGoalAdded) {
        onGoalAdded(resultData as UserGoal); // Propagate to parent for UI update / modal close
      }

      // If not closing via parent callback immediately, clear form for "add mode"
      if (!isEditMode) {
        setTitle('');
        setDescription('');
        setType('professional');
        setStatus('not_started');
        setTargetDate('');
      }
      // Modal closing is typically handled by onGoalAdded/onGoalUpdated in the parent component (AddGoalButton)

    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} goal:`, err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      // Keep modal open on error, clear success message if there was one then error
      if (error) setSuccessMessage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700 mb-1">
          Goal Title <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          id="goalTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Complete leadership course"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="goalDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="goalDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add more details about your goal..."
          disabled={isLoading}
          className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="goalType" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="goalType"
            value={type}
            onChange={(e) => setType(e.target.value as GoalType)}
            disabled={isLoading}
            className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-100"
          >
            <option value="professional">Professional</option>
            <option value="academic">Academic</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="goalStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="goalStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
            // For new goals, status is 'not_started' by default and handled by API.
            // For editing, allow changing status here OR rely on GoalItem for status changes.
            // Disabling if not in edit mode, as API defaults it.
            disabled={isLoading || !isEditMode}
            className="block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-100"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {!isEditMode && <p className="text-xs text-gray-500 mt-1">Status defaults to 'Not Started'.</p>}
        </div>
      </div>

      <div>
        <label htmlFor="goalTargetDate" className="block text-sm font-medium text-gray-700 mb-1">
          Target Date <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <Input
          type="date"
          id="goalTargetDate"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          disabled={isLoading}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="mt-2 text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">
          {successMessage}
        </p>
      )}

      <div className="flex items-center justify-end space-x-3 pt-4 border-t mt-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Goal')}
        </Button>
      </div>
    </form>
  );
}