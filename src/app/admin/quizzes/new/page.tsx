import CreateQuizForm from '@/components/admin/CreateQuizForm';
import { workforceTopics } from '@/lib/constants'; // To populate topic selectors

export const metadata = {
  title: 'Create New Quiz',
};

export default async function CreateNewQuizPage() {
  // This page is protected by AdminLayout from src/app/(admin)/layout.tsx

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-text mb-6">
        Create New Quiz
      </h1>
      <p className="mb-6 text-gray-600">
        Define the metadata for a new quiz. After creating the quiz here, you can add questions to it.
      </p>
      <CreateQuizForm topics={workforceTopics} />
    </div>
  );
}