'use client'

import { useState } from 'react'

export default function ProductGallery({ images = [], name }) {
  const list = images.length ? images : ['']
  const [active, setActive] = useState(0)
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4">
      <div className="flex sm:flex-col gap-3 overflow-x-auto hide-scrollbar">
        {list.map((img, i) => (
          <button key={i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}
            className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${active === i ? 'border-[#B8862F]' : 'border-border'}`}>
            {img ? <img src={img} alt={`${name} thumbnail ${i + 1}`} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted" />}
          </button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-[#f3ece0] aspect-square">
        {list[active] ? (
          <img src={list[active]} alt={`${name} — product image ${active + 1}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image available</div>
        )}
      </div>
    </div>
  )
}
