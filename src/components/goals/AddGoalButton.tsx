'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal'; // We'll create a generic Modal component
import GoalForm from './GoalForm'; // We'll create this form component next
import { PlusIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation'; // To refresh data after adding a goal

interface AddGoalButtonProps {
  isPrimary?: boolean; // Optional prop to change button styling if needed
}

export default function AddGoalButton({ isPrimary = false }: AddGoalButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleGoalAdded = () => {
    closeModal();
    // Refresh the current route to re-fetch goals on the server component (GoalsPage)
    // This ensures the list is up-to-date.
    router.refresh();
    // TODO: Optionally, show a success toast/notification here
  };

  return (
    <>
      <Button
        onClick={openModal}
        variant={isPrimary ? 'primary' : 'secondary'}
        className="flex items-center"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add New Goal
      </Button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create a New Goal">
        {/*
          GoalForm will handle the actual form submission and API call.
          We pass onGoalAdded to it so it can trigger actions in this component
          (like closing the modal and refreshing the goals list).
        */}
        <GoalForm onGoalAdded={handleGoalAdded} onCancel={closeModal} />
      </Modal>
    </>
  );
}