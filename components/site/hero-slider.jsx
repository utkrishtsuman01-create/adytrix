'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Circle, Sparkles, Truck, ShieldCheck, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FALLBACK = {
  eyebrow: 'Handcrafted festive & lifestyle decor',
  title: 'Where Tradition Meets Beauty',
  description: 'Discover ADYTRIX — premium artificial flowers, festive torans, decorative hangings, brass-finish bells and more, crafted to bring warmth and elegance to every corner of your home.',
  buttonText: 'Shop Now',
  buttonHref: '/shop',
  secondaryText: 'Explore Collection',
  secondaryHref: '/categories',
}

export default function HeroSlider({ slides = [], fallback = FALLBACK }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const usable = Array.isArray(slides) ? slides.filter((s) => s?.image) : []
  const items = usable.length ? usable : [fallback]
  const current = items[Math.min(active, items.length - 1)] || fallback

  useEffect(() => {
    if (paused || items.length <= 1) return undefined
    const id = window.setInterval(() => {
      setActive((value) => (value + 1) % items.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [paused, items.length])

  const previous = () => setActive((value) => (value - 1 + items.length) % items.length)
  const next = () => setActive((value) => (value + 1) % items.length)

  return (
    <section
      className="relative isolate min-h-[600px] overflow-hidden bg-[#11181f] sm:min-h-[650px] lg:min-h-[700px]"
      aria-roledescription="carousel"
      aria-label="ADYTRIX featured collection"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {usable.map((slide, index) => (
        <img
          key={slide.image + index}
          src={slide.image}
          alt=""
          aria-hidden={index !== active}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          loading={index === 0 ? 'eager' : 'lazy'}
          className={"absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out " + (index === active ? "opacity-100" : "opacity-0")}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" aria-hidden="true" />

      <div className="container relative z-10 flex min-h-[600px] items-center py-16 sm:min-h-[650px] lg:min-h-[700px]">
        <div className="max-w-2xl">
          {current.eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> {current.eyebrow}
            </span>
          )}
          <h1 className="mt-5 font-display text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {String(current.title || '').split(/\n|<br\s*\/?\s*>/i).map((line, index) => <span key={index} className="block">{line}</span>)}
          </h1>
          {current.description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">{current.description}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {current.buttonText && (
              <Button asChild size="lg" className="h-12 bg-white px-7 text-base text-[#11181f] hover:bg-[#d7eaf3]">
                <Link href={current.buttonHref || '/shop'}>{current.buttonText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
            {current.secondaryText && (
              <Button asChild size="lg" variant="outline" className="h-12 border-white/60 bg-black/10 px-7 text-base text-white hover:bg-white hover:text-[#11181f]">
                <Link href={current.secondaryHref || '/categories'}>{current.secondaryText}</Link>
              </Button>
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#b8d6e5]" /> Free shipping over ₹999</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#b8d6e5]" /> Secure checkout</span>
            <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#b8d6e5]" /> Handmade with care</span>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {items.map((slide, index) => (
              <button key={slide.image + index} type="button" onClick={() => setActive(index)} className="rounded-full p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={'Show slide ' + (index + 1)} aria-current={index === active}>
                <Circle className={"h-2.5 w-2.5 fill-current transition-opacity " + (index === active ? "opacity-100 text-white" : "opacity-45 text-white")} />
              </button>
            ))}
          </div>
          <div className="absolute bottom-6 right-6 z-20 hidden gap-2 sm:flex">
            <button type="button" onClick={previous} aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={next} aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </>
      )}
    </section>
  )
}
