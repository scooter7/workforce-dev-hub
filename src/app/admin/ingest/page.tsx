import DocumentUploadForm from '@/components/admin/DocumentUploadForm';
import { workforceTopics } from '@/lib/constants'; // To populate topic selectors

export const metadata = {
  title: 'Ingest Knowledge Document',
};

export default async function IngestDocumentPage() {
  // This page is protected by AdminLayout

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-text mb-6">
        Ingest New Knowledge Document
      </h1>
      <p className="mb-6 text-gray-600">
        Upload a text file (.txt, .md) to add its content to the RAG knowledge base.
        The content will be chunked, embedded, and stored.
      </p>
      <DocumentUploadForm topics={workforceTopics} />
    </div>
  );
}