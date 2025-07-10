// src/app/admin/quizzes/[quizId]/questions/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams }        from 'next/navigation';
import type { QuizQuestion } from '@/types/quiz';

export default function QuestionsPage() {
  const { quizId } = useParams();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    fetch(`/api/admin/quizzes/${quizId}/questions`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data: QuizQuestion[]) => {
        setQuestions(data);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Unknown error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [quizId]);

  if (loading) return <p>Loading questions…</p>;
  if (error)   return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h1>Questions for Quiz {quizId}</h1>
      <ul>
        {questions.map((q) => (
          <li key={q.id} style={{ marginBottom: '1rem' }}>
            <div>
              <strong>#{q.order_num}</strong> {q.question_text}
            </div>
            <ul>
              {q.options.map((opt) => (
                <li key={opt.id}>
                  {opt.option_text} {opt.is_correct && <em>(correct)</em>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
