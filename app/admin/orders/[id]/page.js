'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Check, X, Truck, PackageCheck, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { inr } from '@/lib/format'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined)
  const [history, setHistory] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => { setOrder(d.error ? null : d.order); setHistory(d.history || []) })
  }, [id])
  useEffect(() => { if (id) load() }, [id, load])

  const changeStatus = async (status) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`Order marked ${status}`); load()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  const markPaid = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/payment`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: 'paid' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Payment marked as paid'); load()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  if (order === undefined) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>
  if (order === null) return <div className="py-20 text-center"><p>Order not found.</p><Button asChild className="mt-4"><Link href="/admin/orders">Back</Link></Button></div>

  const actions = []
  if (order.orderStatus === 'pending') { actions.push({ label: 'Accept', status: 'accepted', icon: Check }, { label: 'Reject', status: 'rejected', icon: X, danger: true }) }
  else if (order.orderStatus === 'accepted') { actions.push({ label: 'Mark Shipped', status: 'shipped', icon: Truck }, { label: 'Reject', status: 'rejected', icon: X, danger: true }) }
  else if (order.orderStatus === 'shipped') { actions.push({ label: 'Mark Completed', status: 'completed', icon: PackageCheck }) }

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-[#B8862F]">← Back to orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Order #{order.orderNumber}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${STATUS_STYLES[order.orderStatus]}`}>{order.orderStatus}</span>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-4">Items</h2>
            {order.items.map((it, i) => (
              <div key={i} className="flex gap-4 py-2">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#f3ece0]">{it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}</div>
                <div className="flex-1"><p className="font-medium line-clamp-1">{it.name}</p><p className="text-sm text-muted-foreground">Qty {it.quantity} x {inr(it.price)}</p></div>
                <div className="font-semibold">{inr(it.price * it.quantity)}</div>
              </div>
            ))}
            <div className="mt-4 border-t border-border pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>- {inr(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? 'Free' : inr(order.shipping)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-2"><span>Total</span><span>{inr(order.total)}</span></div>
            </div>
          </section>

          {history.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl mb-4">Status History</h2>
              <ul className="space-y-2 text-sm">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between"><span className="capitalize font-medium">{h.status}</span><span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString('en-IN')}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-4">Actions</h2>
            <div className="space-y-2">
              {actions.length ? actions.map((a) => (
                <Button key={a.status} onClick={() => changeStatus(a.status)} disabled={busy} variant={a.danger ? 'outline' : 'default'} className={`w-full justify-start ${a.danger ? 'text-destructive border-destructive/40 hover:bg-destructive hover:text-white' : ''}`}><a.icon className="mr-2 h-4 w-4" /> {a.label}</Button>
              )) : <p className="text-sm text-muted-foreground">No further status actions available.</p>}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm mb-2">Payment: <span className="font-medium capitalize">{order.paymentStatus}</span> ({order.paymentMethod === 'cod' ? 'COD' : 'Razorpay'})</p>
              {order.paymentStatus !== 'paid' && <Button onClick={markPaid} disabled={busy} variant="outline" className="w-full"><BadgeCheck className="mr-2 h-4 w-4" /> Mark as Paid</Button>}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-4">Customer</h2>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">{order.deliveryAddress.name}</p>
              <p>{order.deliveryAddress.phone}</p>
              <p>{order.deliveryAddress.email}</p>
              <p className="pt-2">{order.deliveryAddress.address}</p>
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
              <p>{order.deliveryAddress.country}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
