'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input'; // Assuming this is your custom Input component
import { Topic } from '@/lib/constants';

interface DocumentUploadFormProps {
  topics: Topic[];
}

export default function DocumentUploadForm({ topics }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [topicId, setTopicId] = useState<string>(topics[0]?.id || '');
  const [subtopicId, setSubtopicId] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTopic = topics.find(t => t.id === topicId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null); // Clear previous messages
    setError(null);
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Basic client-side check for allowed types (server will also validate)
      if (!['text/plain', 'text/markdown', 'application/pdf'].includes(selectedFile.type)) {
          setError('Invalid file type. Please upload .txt, .md, or .pdf files.');
          setFile(null);
          if (event.target instanceof HTMLInputElement) event.target.value = ''; // Clear file input
          return;
      }
      setFile(selectedFile);
      if (!sourceName) {
        setSourceName(selectedFile.name);
      }
    } else {
        setFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!topicId) {
      setError('Please select a topic.');
      return;
    }
    if (!['text/plain', 'text/markdown', 'application/pdf'].includes(file.type)) {
        setError('Invalid file type. Please upload .txt, .md, or .pdf files. Server will also validate.');
        return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', topicId);
    if (subtopicId) {
      formData.append('subtopicId', subtopicId);
    }
    // Use file.name as a fallback if sourceName is empty, but ensure sourceName is preferred if filled.
    formData.append('sourceName', sourceName.trim() || file.name);

    try {
      const response = await fetch('/api/admin/ingest-document', { // API now just uploads to storage
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to upload document (Status: ${response.status})`);
      }

      setMessage(result.message || 'File uploaded successfully and queued for ingestion!');
      // Clear form for next upload
      setFile(null);
      setSourceName('');
      // Reset file input visually
      const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
          Document File (.txt, .md, .pdf) <span className="text-red-500">*</span>
        </label>
        <Input
          type="file"
          id="fileUpload" // Keep ID for resetting
          onChange={handleFileChange}
          accept=".txt,.md,.pdf" // Updated to include PDF
          required
          className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary-light file:text-brand-primary hover:file:bg-brand-primary/20"
        />
      </div>

      <div>
        <label htmlFor="sourceName" className="block text-sm font-medium text-gray-700 mb-1">
          Source Name / Original Filename <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          id="sourceName"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="e.g., leadership_strategies_chapter1.pdf"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="topicId" className="block text-sm font-medium text-gray-700 mb-1">
          Topic <span className="text-red-500">*</span>
        </label>
        <select
          id="topicId"
          value={topicId}
          onChange={(e) => {
            setTopicId(e.target.value);
            setSubtopicId('');
          }}
          required
          disabled={isLoading}
          className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        >
          <option value="" disabled>Select a topic</option>
          {topics.map(topic => (
            <option key={topic.id} value={topic.id}>{topic.title}</option>
          ))}
        </select>
      </div>

      {selectedTopic && selectedTopic.subtopics.length > 0 && (
        <div>
          <label htmlFor="subtopicId" className="block text-sm font-medium text-gray-700 mb-1">
            Subtopic (Optional)
          </label>
          <select
            id="subtopicId"
            value={subtopicId}
            onChange={(e) => setSubtopicId(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full p-2 border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          >
            <option value="">None (applies to main topic)</option>
            {selectedTopic.subtopics.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.title}</option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
          {error}
        </p>
      )}

      <div className="pt-2">
        <Button type="submit" disabled={isLoading || !file}>
          {isLoading ? 'Uploading...' : 'Upload Document for Ingestion'}
        </Button>
      </div>
    </form>
  );
}