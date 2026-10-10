'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, Star, MessageCircle, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function DirectReviewPage() {
  const params = useParams()
  const token = params?.token
  const [data, setData] = useState(undefined)
  const [drafts, setDrafts] = useState({})
  const [submitting, setSubmitting] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`/api/review/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not open review link')
        return json
      })
      .then(setData)
      .catch((error) => setData({ error: error.message || 'This review link is invalid or expired.' }))
  }, [token])

  const updateDraft = (productId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { rating: 5, comment: '', ...(prev[productId] || {}), ...patch },
    }))
  }

  const submitReview = async (productId) => {
    const draft = drafts[productId] || { rating: 5, comment: '' }
    setSubmitting(productId)
    try {
      const res = await fetch(`/api/review/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating: draft.rating, comment: draft.comment }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not submit the review')
      setData((prev) => ({
        ...prev,
        reviews: [...(prev.reviews || []).filter((review) => review.productId !== productId), result.review],
      }))
      toast.success('Thank you for reviewing ADYTRIX!')
    } catch (error) {
      toast.error(error.message || 'Could not submit the review')
    } finally {
      setSubmitting('')
    }
  }

  if (data === undefined) {
    return <div className="container py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#5f8aa1]" /><p className="mt-3 text-sm text-muted-foreground">Opening your review link…</p></div>
  }

  if (data?.error) {
    return (
      <div className="container max-w-xl py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf3f7] text-[#5f8aa1]"><MessageCircle className="h-7 w-7" /></div>
        <h1 className="mt-5 font-display text-2xl">Review link unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.error}</p>
        <Button asChild className="mt-6"><Link href="/">Visit ADYTRIX</Link></Button>
      </div>
    )
  }

  return (
    <main className="container max-w-3xl py-8 sm:py-12">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eaf3f7] text-[#5f8aa1]"><ShoppingBag className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f8aa1]">ADYTRIX</p>
            <h1 className="font-display text-2xl sm:text-3xl">How did we do?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Order #{data.order.orderNumber}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">Thank you for shopping with ADYTRIX. Please rate the items you received and share feedback to help other shoppers.</p>

        <div className="mt-7 space-y-5">
          {data.order.items.map((item, index) => {
            const review = (data.reviews || []).find((entry) => entry.productId === item.productId)
            const draft = drafts[item.productId] || { rating: 5, comment: '' }
            return (
              <section key={`${item.productId || item.slug}-${index}`} className="rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eaf3f7]">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                </div>

                {review ? (
                  <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-900">
                    <p className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4" /> Review submitted</p>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-5 w-5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-green-900/30'}`} />)}
                    </div>
                    {review.comment ? <p className="mt-2 whitespace-pre-line text-sm">{review.comment}</p> : <p className="mt-2 text-sm">Thanks for leaving a rating.</p>}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Your rating</p>
                    <div className="mt-2 flex items-center gap-1" role="group" aria-label={`Rate ${item.name}`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`${star} star${star === 1 ? '' : 's'}`}
                          aria-pressed={draft.rating === star}
                          onClick={() => updateDraft(item.productId, { rating: star })}
                          className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f8aa1]"
                        >
                          <Star className={`h-7 w-7 ${star <= draft.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                      <span className="ml-2 text-xs text-muted-foreground">{draft.rating}/5</span>
                    </div>
                    <label className="mt-4 block text-sm font-medium" htmlFor={`review-${item.productId}`}>Comment (optional)</label>
                    <textarea
                      id={`review-${item.productId}`}
                      value={draft.comment}
                      maxLength={1000}
                      rows={3}
                      onChange={(event) => updateDraft(item.productId, { comment: event.target.value })}
                      placeholder="Tell us what you liked or what could be better…"
                      className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#5f8aa1]"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{draft.comment.length}/1000 characters</span>
                      <Button onClick={() => submitReview(item.productId)} disabled={submitting === item.productId}>
                        {submitting === item.productId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                        Submit review
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Your feedback helps ADYTRIX improve its products and service.</p>
      </div>
    </main>
  )
}
