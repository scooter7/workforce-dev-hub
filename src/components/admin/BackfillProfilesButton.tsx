'use client';

import { useState } from 'react';

export default function BackfillProfilesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackfill = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/backfill-profiles', {
        method: 'POST',
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError('Server returned invalid JSON: ' + text);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || data.message || 'Unknown error');
      } else {
        setResult(data.message || 'Backfill complete.');
      }
      // For debugging: log the full response
      // eslint-disable-next-line no-console
      console.log('Backfill response:', data);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleBackfill}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
      >
        {loading ? 'Backfilling...' : 'Admin: Backfill Profiles'}
      </button>
      {result && (
        <div className="mt-2 text-green-700 bg-green-100 p-2 rounded">{result}</div>
      )}
      {error && (
        <div className="mt-2 text-red-700 bg-red-100 p-2 rounded">{error}</div>
      )}
    </div>
  );
}