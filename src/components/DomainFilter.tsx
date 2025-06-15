// src/components/DomainFilter.tsx
import React from 'react'

type Props = { domain: string; onChange: (d: string) => void }

export default function DomainFilter({ domain, onChange }: Props) {
  return (
    <div className="mb-6">
      <label className="block mb-1 font-medium">Email Domain Filter</label>
      <input
        type="text"
        value={domain}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. shmooze.io"
        className="w-full px-3 py-2 border rounded"
      />
    </div>
  )
}
