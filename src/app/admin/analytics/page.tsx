// src/app/admin/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import MetricCard from '@/components/MetricCard'
import DomainFilter from '@/components/DomainFilter'

type Metrics = {
  topics: number
  subtopics: number
  quizzesTaken: number
  goalsCreated: number
  goalsCompleted: number
}

export default function AdminAnalyticsPage() {
  const [domain, setDomain] = useState('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const qs = domain ? `?domain=${encodeURIComponent(domain)}` : ''
        const res = await fetch(`/api/admin/analytics${qs}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Fetch failed')
        setMetrics(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [domain])

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Admin Analytics Dashboard</h1>

      <DomainFilter domain={domain} onChange={setDomain} />

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard label="Topics" value={metrics.topics} />
          <MetricCard label="Subtopics" value={metrics.subtopics} />
          <MetricCard label="Quizzes Taken" value={metrics.quizzesTaken} />
          <MetricCard label="Goals Created" value={metrics.goalsCreated} />
          <MetricCard label="Goals Completed" value={metrics.goalsCompleted} />
        </div>
      )}
    </main>
  )
}
