'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Package, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inr } from '@/lib/format'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}
const PAY_STYLES = { paid: 'text-green-700', pending: 'text-amber-700', failed: 'text-red-700' }

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState(undefined)

  useEffect(() => {
    fetch('/api/orders').then((r) => { if (r.status === 401) { router.replace('/login?redirect=/orders'); return null } return r.json() })
      .then((d) => { if (d) setOrders(d.orders || []) })
  }, [router])

  if (orders === undefined) return <div className="container py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>

  if (orders.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Package className="h-9 w-9" /></div>
        <h1 className="font-display text-3xl">No orders yet</h1>
        <p className="mt-2 text-muted-foreground">When you place an order it will appear here.</p>
        <Button asChild className="mt-6"><Link href="/shop">Start Shopping</Link></Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Order #{o.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[o.orderStatus] || 'bg-muted'}`}>{o.orderStatus}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex -space-x-3">
                {o.items.slice(0, 4).map((it, i) => (
                  <div key={i} className="h-12 w-12 overflow-hidden rounded-lg border-2 border-card bg-[#f3ece0]">{it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}</div>
                ))}
                {o.items.length > 4 && <div className="h-12 w-12 rounded-lg border-2 border-card bg-muted flex items-center justify-center text-xs">+{o.items.length - 4}</div>}
              </div>
              <div className="text-right">
                <p className="font-semibold">{inr(o.total)}</p>
                <p className={`text-xs font-medium capitalize ${PAY_STYLES[o.paymentStatus] || ''}`}>Payment: {o.paymentStatus}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
