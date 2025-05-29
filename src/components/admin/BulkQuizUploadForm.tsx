// src/components/admin/BulkQuizUploadForm.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input'; // Assuming your Input can handle type="file"

interface UploadResponse {
  message: string;
  successfulRows?: number;
  failedRows?: number;
  errors?: Array<{ row: number; error: string; details?: any }>;
  details?: any; // For general API errors
}

export default function BulkQuizUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<UploadResponse['errors'] | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResponseMessage(null); // Clear previous messages
      setErrorDetails(null);
      setIsSuccess(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setResponseMessage('Please select a CSV file to upload.');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setResponseMessage(null);
    setErrorDetails(null);
    setIsSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/quizzes/bulk-upload', {
        method: 'POST',
        body: formData, // Sending as FormData
      });

      const result: UploadResponse = await response.json();

      if (!response.ok) {
        setIsSuccess(false);
        setResponseMessage(result.message || `Upload failed (Status: ${response.status})`);
        if (result.errors) setErrorDetails(result.errors);
        else if (result.details) setErrorDetails([{row: 0, error: "API Error", details: result.details}]);
        throw new Error(result.message || 'Upload failed');
      }
      
      setIsSuccess(true);
      setResponseMessage(result.message);
      if (result.successfulRows !== undefined) {
        setResponseMessage(prev => `${prev} Successfully processed: ${result.successfulRows} rows.`);
      }
      if (result.failedRows !== undefined && result.failedRows > 0) {
        setResponseMessage(prev => `${prev} Failed to process: ${result.failedRows} rows.`);
        setErrorDetails(result.errors || []);
      } else if (result.errors && result.errors.length > 0) {
        setErrorDetails(result.errors);
      }


    } catch (err: any) {
      console.error('Bulk upload error:', err);
      setIsSuccess(false);
      setResponseMessage(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsLoading(false);
      setFile(null); // Clear file input after attempt
      if (event.target instanceof HTMLFormElement) {
        event.target.reset(); // Resets the file input field
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">
            CSV File
          </label>
          <Input
            type="file"
            id="csvFile"
            name="csvFile"
            onChange={handleFileChange}
            accept=".csv"
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary-light file:text-brand-primary hover:file:bg-brand-primary/20"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be a .csv file with the specified columns. Max file size: 5MB.
          </p>
        </div>

        {responseMessage && (
          <div className={`p-4 rounded-md text-sm ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <p className="font-medium">{isSuccess ? 'Success!' : 'Error:'}</p>
            <p>{responseMessage}</p>
          </div>
        )}

        {errorDetails && errorDetails.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md max-h-60 overflow-y-auto">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Processing Errors:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-700">
              {errorDetails.map((detail, index) => (
                <li key={index}>
                  Row {detail.row}: {detail.error}
                  {detail.details && <pre className="mt-1 text-xs bg-red-100 p-1 rounded overflow-x-auto">{typeof detail.details === 'string' ? detail.details : JSON.stringify(detail.details)}</pre>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !file}>
            {isLoading ? 'Uploading & Processing...' : 'Upload and Create Quizzes'}
          </Button>
        </div>
      </form>
    </div>
  );
}