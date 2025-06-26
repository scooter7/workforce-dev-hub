'use client';

import { useState } from 'react';
import { UserGoal, GoalStatus, GoalType } from '@/app/(dashboard)/goals/page';
import Button from '@/components/ui/Button';
import {
  CalendarDaysIcon,
  TrashIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
// Removed StopCircleIcon, PlayCircleIcon, CheckCircleIcon as getStatusIcon is removed

interface GoalItemProps {
  goal: UserGoal;
  onUpdateGoal: (updatedGoal: UserGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onEditGoal: (goal: UserGoal) => void;
}

// getStatusIcon function removed as it was unused

const getTypeIcon = (type: GoalType) => {
  const iconClass = "h-8 w-8 text-gray-500";
  switch (type) {
    case 'academic':
      return <AcademicCapIcon className={iconClass} title="Academic" />;
    case 'professional':
      return <BriefcaseIcon className={iconClass} title="Professional" />;
    case 'personal':
      return <UserIcon className={iconClass} title="Personal" />;
    case 'other':
      return <TagIcon className={iconClass} title="Other" />;
    default:
      return null;
  }
};

const formatDisplayDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const localDate = new Date(year, month, day); 
    if (isNaN(localDate.getTime())) return 'Invalid Date';
    return localDate.toLocaleDateString(undefined, {});
  }
  return dateString;
};

const validStatuses: GoalStatus[] = ['not_started', 'in_progress', 'completed'];

export default function GoalItem({ goal, onUpdateGoal, onDeleteGoal, onEditGoal }: GoalItemProps) {
  const [currentStatus, setCurrentStatus] = useState<GoalStatus>(
    validStatuses.includes(goal.status as GoalStatus) 
      ? goal.status as GoalStatus 
      : 'not_started'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: GoalStatus) => {
    if (newStatus === currentStatus) return;
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`/api/goals/${goal.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
        throw new Error(errData.error || 'Failed to update goal status.');
      }
      const updatedGoalFromServer = await response.json();
      setCurrentStatus(updatedGoalFromServer.status);
      if (onUpdateGoal) onUpdateGoal(updatedGoalFromServer);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the goal: "${goal.title}"?`)) return;
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
        throw new Error(errData.error || 'Failed to delete goal.');
      }
      if (onDeleteGoal) onDeleteGoal(goal.id);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const cardShadowClass = (status: GoalStatus) => {
    switch (status) {
      case 'not_started':
        return 'shadow-lg shadow-gray-400/50';
      case 'in_progress':
        return 'shadow-lg shadow-blue-500/50';
      case 'completed':
        return 'shadow-lg shadow-green-500/50';
      default:
        return 'shadow-lg';
    }
  };

  return (
    <div className={`bg-white rounded-xl p-5 ${cardShadowClass(currentStatus)} flex flex-col justify-between transition-all hover:shadow-2xl min-h-[200px]`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-neutral-text break-words mr-2">{goal.title}</h3>
          <div className="flex-shrink-0 ml-2">{getTypeIcon(goal.type)}</div>
        </div>
        {goal.description && <p className="text-sm text-gray-600 mb-3 break-words whitespace-pre-wrap">{goal.description}</p>}
        {goal.target_date && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
            Target: {formatDisplayDate(goal.target_date)}
          </div>
        )}
      </div>
      <div className="mt-auto pt-4">
        {error && <p className="text-xs text-red-500 mb-2 text-center">{error}</p>}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="w-full sm:w-auto">
            <label htmlFor={`status-${goal.id}`} className="sr-only">Status</label>
            <select
              id={`status-${goal.id}`}
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as GoalStatus)}
              disabled={isLoading}
              className={`w-full text-sm p-2 border rounded-md focus:ring-2 focus:ring-brand-primary transition-colors ${
                currentStatus === 'not_started' ? 'bg-gray-100 border-gray-300 text-gray-700' :
                currentStatus === 'in_progress' ? 'bg-blue-50 border-blue-400 text-blue-700' :
                currentStatus === 'completed' ? 'bg-green-50 border-green-400 text-green-700 font-medium' :
                'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex space-x-2 items-center flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEditGoal(goal)} disabled={isLoading} aria-label="Edit goal" className="p-1.5">
              <PencilSquareIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading} aria-label="Delete goal" className="p-1.5 text-red-500 hover:bg-red-100">
              <TrashIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Last updated: {new Date(goal.updated_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}