'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Check, Clock, Truck, PackageCheck, XCircle, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/site/breadcrumbs'
import { startRazorpayPayment } from '@/lib/razorpay-client'
import { inr } from '@/lib/format'

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'completed', label: 'Completed', icon: PackageCheck },
]

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const [order, setOrder] = useState(undefined)
  const [paying, setPaying] = useState(false)

  const loadOrder = useCallback(() => {
    if (!id) return
    fetch(`/api/orders/${id}`).then((r) => {
      if (r.status === 401) { router.replace(`/login?redirect=/orders/${id}`); return null }
      return r.json()
    }).then((d) => { if (d) setOrder(d.error ? null : d.order) })
  }, [id, router])

  useEffect(() => { loadOrder() }, [loadOrder])

  const payNow = async () => {
    setPaying(true)
    try {
      const result = await startRazorpayPayment({ orderId: order.id, prefill: { name: order.deliveryAddress.name, email: order.deliveryAddress.email, phone: order.deliveryAddress.phone } })
      if (result.status === 'paid') { toast.success('Payment successful!'); loadOrder() }
      else if (result.status === 'dismissed') toast('Payment cancelled.')
      else toast.error('Payment not completed.')
    } catch (e) { toast.error(e.message || 'Could not start payment') } finally { setPaying(false) }
  }

  if (order === undefined) return <div className="container py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
  if (order === null) return <div className="container py-20 text-center"><h1 className="font-display text-2xl">Order not found</h1><Button asChild className="mt-4"><Link href="/orders">Back to orders</Link></Button></div>

  const rejected = order.orderStatus === 'rejected'
  const currentIndex = STEPS.findIndex((s) => s.key === order.orderStatus)

  return (
    <div className="container max-w-4xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Orders', href: '/orders' }, { label: `#${order.orderNumber}` }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl">Order #{order.orderNumber}</h1>
        <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
      </div>

      {/* Tracking */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl mb-6">Order Tracking</h2>
        {rejected ? (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800">
            <XCircle className="h-6 w-6" />
            <div><p className="font-semibold">Order Rejected</p><p className="text-sm">Unfortunately this order could not be processed. Please contact us for assistance.</p></div>
          </div>
        ) : (
          <div className="flex justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            <div className="absolute top-5 left-0 h-0.5 bg-[#B8862F] transition-all" style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }} />
            {STEPS.map((step, i) => {
              const done = i <= currentIndex
              const Icon = step.icon
              return (
                <div key={step.key} className="relative flex flex-col items-center gap-2 bg-card px-1 z-10" style={{ flex: 1 }}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${done ? 'border-[#B8862F] bg-[#B8862F] text-white' : 'border-border bg-card text-muted-foreground'}`}><Icon className="h-5 w-5" /></div>
                  <span className={`text-xs text-center font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <section className="md:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((it, i) => (
              <div key={i} className="flex gap-4">
                <Link href={`/products/${it.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f3ece0]">{it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}</Link>
                <div className="flex-1"><Link href={`/products/${it.slug}`} className="font-medium hover:text-[#B8862F] line-clamp-1">{it.name}</Link><p className="text-sm text-muted-foreground">Qty {it.quantity} x {inr(it.price)}</p></div>
                <div className="font-semibold">{inr(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>- {inr(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? 'Free' : inr(order.shipping)}</span></div>
            <div className="flex justify-between text-base font-semibold border-t border-border pt-2"><span>Total</span><span>{inr(order.total)}</span></div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 h-fit">
          <h2 className="font-display text-xl mb-4">Delivery</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{order.deliveryAddress.name}</p>
            <p>{order.deliveryAddress.phone}</p>
            <p>{order.deliveryAddress.email}</p>
            <p className="pt-2">{order.deliveryAddress.address}</p>
            <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
            <p>{order.deliveryAddress.country}</p>
          </div>
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <p className="capitalize">Payment: <span className="font-medium">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span></p>
            <p className="capitalize">Status: <span className="font-medium">{order.paymentStatus}</span></p>
          </div>
          {order.paymentMethod === 'razorpay' && order.paymentStatus === 'pending' && (
            <Button onClick={payNow} disabled={paying} className="w-full mt-4">{paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} Pay {inr(order.total)}</Button>
          )}
        </section>
      </div>
    </div>
  )
}
