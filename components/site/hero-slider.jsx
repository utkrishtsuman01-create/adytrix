'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react'

export default function HeroSlider({ slides = [], children }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [paused, slides.length])

  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length)
  const next = () => setActive((current) => (current + 1) % slides.length)

  return (
    <section
      className="relative isolate min-h-[620px] overflow-hidden bg-[#1b1613] sm:min-h-[680px] lg:min-h-[720px]"
      aria-roledescription="carousel"
      aria-label="ADYTRIX featured collection"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.length > 0 && slides.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden={index !== active}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          loading={index === 0 ? 'eager' : 'lazy'}
          className={"absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out " + (index === active ? "opacity-100" : "opacity-0")}
        />
      ))}

      {slides.length > 0 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(214,174,92,0.18),transparent_32%)]" aria-hidden="true" />
        </>
      )}

      <div className="container relative z-10 flex min-h-[620px] items-center py-16 sm:min-h-[680px] lg:min-h-[720px]">
        <div className="max-w-2xl">
          {children}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(index)}
                className="rounded-full p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={'Show slide ' + (index + 1)}
                aria-current={index === active}
              >
                <Circle className={"h-2.5 w-2.5 fill-current transition-opacity " + (index === active ? "opacity-100 text-white" : "opacity-45 text-white")} />
              </button>
            ))}
          </div>

          <div className="absolute bottom-6 right-6 z-20 hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
