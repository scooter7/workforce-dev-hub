// src/app/admin/quizzes/[quizId]/questions/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams }        from 'next/navigation'
import { QuizQuestion }     from '@/types/quiz'

export default function QuestionsPage() {
  const { quizId } = useParams()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!quizId) return
    fetch(`/api/admin/quizzes/${quizId}/questions`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
  }, [quizId])

  if (loading) return <p>Loading…</p>
  return (
    <div>
      <h1>Quiz Questions</h1>
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            <strong>#{q.order_num}</strong> {q.question_text}
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
  )
}
