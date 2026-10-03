'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ChevronRight } from 'lucide-react'
import { inr } from '@/lib/format'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
}
const FILTERS = ['all', 'pending', 'accepted', 'shipped', 'completed', 'rejected']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetch('/api/admin/orders').then((r) => r.json()).then((d) => setOrders(d.orders || [])).catch(() => setOrders([])) }, [])

  if (!orders) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.orderStatus === filter)

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Orders</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${filter === f ? 'bg-[#1b1613] text-[#f4ead6]' : 'bg-card border border-border hover:bg-muted'}`}>{f}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
              <div>
                <p className="font-medium">#{o.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{o.deliveryAddress?.name} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{inr(o.total)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.orderStatus] || 'bg-muted'}`}>{o.orderStatus}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
