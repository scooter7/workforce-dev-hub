'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input'; // Assuming your Input can handle type="file"

interface UploadResponseErrorDetail {
  row: number;
  error: string;
  details?: any;
}

interface UploadResponse {
  message: string;
  successfulRows?: number;
  failedRows?: number;
  errors?: UploadResponseErrorDetail[];
  details?: any; // For general API errors not fitting the row structure
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
    } else {
      setFile(null); // Also clear file if selection was cancelled
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setResponseMessage('Please select a CSV file to upload.');
      setIsSuccess(false);
      setErrorDetails(null);
      return;
    }

    setIsLoading(true);
    setResponseMessage('Uploading and processing... please wait.'); // Initial processing message
    setErrorDetails(null);
    setIsSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/quizzes/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text(); // Read response as text first
      console.log("Raw API Response Text:", responseText); // Log the raw text for debugging

      let result: UploadResponse;
      try {
        result = JSON.parse(responseText); // Attempt to parse the text as JSON
      } catch (e) {
        // If parsing fails, it means the response was not valid JSON
        console.error("Failed to parse API response as JSON:", e);
        console.error("Response text that failed to parse:", responseText);
        setIsSuccess(false);
        setResponseMessage(`Error: Server returned an invalid response. Status: ${response.status}. Check console for details.`);
        setErrorDetails([{ row: 0, error: "Invalid server response", details: responseText.substring(0, 500) + (responseText.length > 500 ? "..." : "") }]);
        setIsLoading(false);
        // Reset file input
        if (event.target instanceof HTMLFormElement) {
            event.target.reset();
        }
        setFile(null);
        return;
      }

      // Now proceed with the logic based on response.ok and the parsed result
      if (!response.ok) {
        setIsSuccess(false);
        setResponseMessage(result.message || `Upload failed (Status: ${response.status})`);
        if (result.errors) setErrorDetails(result.errors);
        else if (result.details) setErrorDetails([{row: 0, error: "API Error", details: result.details}]);
        else setErrorDetails([{row: 0, error: "Server Error", details: result.message || "Unknown server error"}]);
        // No need to throw an error here as we're setting state for UI feedback
      } else {
        setIsSuccess(true);
        let successMsg = result.message || "Processing complete.";
        if (result.successfulRows !== undefined) {
          successMsg += ` Successfully processed: ${result.successfulRows} rows.`;
        }
        if (result.failedRows !== undefined && result.failedRows > 0) {
          successMsg += ` Failed to process: ${result.failedRows} rows.`;
          setErrorDetails(result.errors || []);
          if(result.successfulRows === 0) setIsSuccess(false); // Mark as not fully successful if there were failures
        } else if (result.errors && result.errors.length > 0) {
          // If there are errors reported even on a 200/207, show them
          setErrorDetails(result.errors);
          if(result.successfulRows === 0 && result.failedRows === undefined) setIsSuccess(false);
        }
        setResponseMessage(successMsg);
      }

    } catch (err: any) { // Catches network errors or other client-side exceptions before/during fetch
      console.error('Bulk upload fetch/client-side error:', err);
      setIsSuccess(false);
      setResponseMessage(err.message || 'An unexpected network or client-side error occurred.');
      setErrorDetails([{row: 0, error: "Client-side Error", details: err.message}]);
    } finally {
      setIsLoading(false);
      setFile(null); // Clear file from state
      // Reset the actual file input field
      if (event.target instanceof HTMLFormElement) {
        const fileInput = event.target.elements.namedItem('csvFile') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = ''; // This is a common way to reset file input
        }
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
            name="csvFile" // Added name attribute for form.reset() to potentially work, or for manual reset
            onChange={handleFileChange}
            accept=".csv"
            // `required` is good, but we also check `!file` in handleSubmit
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary-light file:text-brand-primary hover:file:bg-brand-primary/20"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be a .csv file with the specified columns. Max file size: 5MB.
          </p>
        </div>

        {responseMessage && (
          <div className={`p-4 rounded-md text-sm ${isSuccess && (!errorDetails || errorDetails.length === 0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <p className="font-medium">
                {isSuccess && (!errorDetails || errorDetails.length === 0) ? 'Upload Status:' : 'Upload Error:'}
            </p>
            <p>{responseMessage}</p>
          </div>
        )}

        {errorDetails && errorDetails.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md max-h-60 overflow-y-auto">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Detailed Processing Errors:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-700">
              {errorDetails.map((detail, index) => (
                <li key={index}>
                  Row {detail.row}: {detail.error}
                  {detail.details && <pre className="mt-1 text-xs bg-red-100 p-1 rounded overflow-x-auto">{typeof detail.details === 'string' ? detail.details : JSON.stringify(detail.details, null, 2)}</pre>}
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