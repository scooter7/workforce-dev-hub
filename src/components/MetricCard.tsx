// src/components/MetricCard.tsx
import React from 'react'

type Props = { label: string; value: number }

export default function MetricCard({ label, value }: Props) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-gray-600">{label}</div>
    </div>
  )
}
