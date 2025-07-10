'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserGoal } from '@/app/(dashboard)/goals/page';
import GoalItem from './GoalItem';
import Modal from '@/components/ui/Modal'; // Import Modal
import GoalForm from './GoalForm';   // Import GoalForm
// import { useRouter } from 'next/navigation'; // For router.refresh if not using optimistic updates fully

interface GoalListProps {
  initialGoals: UserGoal[];
}

export default function GoalList({ initialGoals }: GoalListProps) {
  const [goals, setGoals] = useState<UserGoal[]>(initialGoals);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const router = useRouter();

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  const handleUpdateGoalInList = useCallback((updatedGoal: UserGoal) => {
    setGoals(prevGoals =>
      prevGoals.map(g => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    // Optionally, show a success toast/notification
  }, []);

  const handleDeleteGoalFromList = useCallback((goalId: string) => {
    setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
    // Optionally, show a success toast/notification
  }, []);

  const handleOpenEditModal = useCallback((goalToEdit: UserGoal) => {
    setEditingGoal(goalToEdit);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingGoal(null); // Clear the editing goal
  };

  const handleGoalSuccessfullyEdited = (updatedGoal: UserGoal) => {
    handleUpdateGoalInList(updatedGoal); // Update the goal in the local list
    handleCloseEditModal(); // Close the modal
    // No need for router.refresh() here if handleUpdateGoalInList provides good UX
    // However, if updated_at or other server-computed fields are critical to display immediately,
    // router.refresh() could be called, or the API should return the full updated object.
    // Our PATCH API already returns the updated goal.
  };

  if (!goals || goals.length === 0) {
    return <p className="text-center text-gray-500">You have no goals yet. (From GoalList)</p>;
  }

  const notStartedGoals = goals.filter(g => g.status === 'not_started').sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const completedGoals = goals.filter(g => g.status === 'completed').sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const renderGoalSection = (title: string, goalsInSection: UserGoal[]) => {
    if (goalsInSection.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-text mb-4 capitalize border-b pb-2">
          {title.replace('_', ' ')} ({goalsInSection.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsInSection.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onUpdateGoal={handleUpdateGoalInList} // For status updates from GoalItem
              onDeleteGoal={handleDeleteGoalFromList}
              onEditGoal={handleOpenEditModal} // Pass the new handler
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8">
        {renderGoalSection('Not Started', notStartedGoals)}
        {renderGoalSection('In Progress', inProgressGoals)}
        {renderGoalSection('Completed', completedGoals)}
        {goals.length > 0 && notStartedGoals.length === 0 && inProgressGoals.length === 0 && completedGoals.length === 0 && (
           <p className="text-center text-gray-500">No goals to display in any category.</p>
        )}
      </div>

      {isEditModalOpen && editingGoal && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Goal" size="lg">
          <GoalForm
            initialData={editingGoal} // Pass the goal to be edited
            onGoalUpdated={handleGoalSuccessfullyEdited} // Callback for successful update
            onCancel={handleCloseEditModal} // Callback for cancellation
            // userId is not passed as GoalForm doesn't directly use it for API calls (API infers user)
          />
        </Modal>
      )}
    </>
  );
}