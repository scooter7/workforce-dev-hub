// src/app/admin/quizzes/bulk-upload/page.tsx
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import BulkQuizUploadForm from '@/components/admin/BulkQuizUploadForm'; // We will create this next

export const metadata = {
  title: 'Bulk Upload Quizzes',
};

export default async function BulkUploadQuizzesPage() {
  // This page is protected by AdminLayout from src/app/(admin)/layout.tsx
  // (Assuming your admin folder is src/app/admin/ and not src/app/(admin)/)
  // If it's (admin), the path would be /quizzes/bulk-upload

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/quizzes/new" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Quiz Creation / Management
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-neutral-text mb-2">
        Bulk Upload Quiz Questions via CSV
      </h1>
      <p className="mb-6 text-gray-600">
        Upload a CSV file to create multiple quizzes and questions at once.
        Please ensure your CSV follows the required format.
      </p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
        <p className="text-sm text-yellow-700">
          <strong>Required CSV Columns (in order):</strong><br />
          <code>Main Topic Title</code>, <code>Subtopic Title</code> (can be blank), <code>Question Text</code>, <code>Question Type</code> (multiple-choice or true-false), <code>Points</code> (number), <code>Explanation</code> (can be blank), <code>Video Embed Code</code> (can be blank, full iframe), <code>Image URL</code> (can be blank), <code>Media Position</code> (above_text or below_text, blank if no media), <code>Option 1 Text</code>, <code>Option 1 IsCorrect</code> (TRUE/FALSE), <code>Option 2 Text</code>, <code>Option 2 IsCorrect</code>, <code>Option 3 Text</code> (can be blank), <code>Option 3 IsCorrect</code> (can be blank)
        </p>
         <p className="text-xs text-yellow-600 mt-2">
            Note: "Main Topic Title" and "Subtopic Title" must exactly match the titles defined in your application's constants. If a quiz for a topic/subtopic combination doesn't exist, a new quiz will be created with a generated title.
        </p>
      </div>

      <BulkQuizUploadForm />
    </div>
  );
}