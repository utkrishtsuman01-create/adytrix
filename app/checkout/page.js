'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Lock, CreditCard, Banknote, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/components/site/cart'
import { inr } from '@/lib/format'

const RZP_LINK = process.env.NEXT_PUBLIC_RAZORPAY_LINK || 'https://razorpay.me/@adityabanik'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clear, ready } = useCart()
  const [user, setUser] = useState(undefined)
  const [placing, setPlacing] = useState(false)
  const [method, setMethod] = useState('razorpay_link')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', country: 'India' })

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setUser(d.user)
      if (!d.user) router.replace('/login?redirect=/checkout')
      else setForm((f) => ({ ...f, name: d.user.name || '', email: d.user.email || '', phone: d.user.phone || '' }))
    })
  }, [router])

  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 59
  const total = subtotal + shipping
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const placeOrder = async (e) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), deliveryAddress: form, paymentMethod: method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create order')
      clear()
      if (method === 'razorpay_link') {
        window.open(RZP_LINK, '_blank', 'noopener')
        toast.success('Order placed!', { description: 'Complete payment via Razorpay. We will confirm your order shortly.' })
      } else {
        toast.success('Order placed!', { description: 'Your order has been received.' })
      }
      router.push(`/orders/${data.order.id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (user === undefined || !ready) return <div className="container py-20 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
  if (ready && items.length === 0) {
    return <div className="container py-20 text-center"><h1 className="font-display text-2xl">Your cart is empty</h1><Button asChild className="mt-4"><Link href="/shop">Shop now</Link></Button></div>
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Checkout</h1>
      <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-5">Delivery Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Full Name</Label><Input id="name" required value={form.name} onChange={set('name')} className="mt-1.5" /></div>
              <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" required value={form.phone} onChange={set('phone')} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" required value={form.email} onChange={set('email')} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label htmlFor="address">Full Delivery Address</Label><Input id="address" required value={form.address} onChange={set('address')} className="mt-1.5" placeholder="House no, street, area, landmark" /></div>
              <div><Label htmlFor="city">City</Label><Input id="city" required value={form.city} onChange={set('city')} className="mt-1.5" /></div>
              <div><Label htmlFor="state">State</Label><Input id="state" required value={form.state} onChange={set('state')} className="mt-1.5" /></div>
              <div><Label htmlFor="postalCode">Postal Code</Label><Input id="postalCode" required value={form.postalCode} onChange={set('postalCode')} className="mt-1.5" /></div>
              <div><Label htmlFor="country">Country</Label><Input id="country" value={form.country} onChange={set('country')} className="mt-1.5" /></div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-5">Payment Method</h2>
            <RadioGroup value={method} onValueChange={setMethod} className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="razorpay_link" id="rzp" className="mt-0.5" />
                <div><div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-[#B8862F]" /> Pay Online (Razorpay)</div><p className="text-sm text-muted-foreground mt-1">Pay securely via Razorpay. Your order is confirmed once payment is verified by our team.</p></div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
                <div><div className="flex items-center gap-2 font-medium"><Banknote className="h-4 w-4 text-[#B8862F]" /> Cash on Delivery</div><p className="text-sm text-muted-foreground mt-1">Pay in cash when your order is delivered.</p></div>
              </label>
            </RadioGroup>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-6 sticky top-28">
            <h2 className="font-display text-xl mb-4">Your Order</h2>
            <div className="space-y-3 max-h-64 overflow-auto pr-1">
              {items.map((i) => (
                <div key={i.productId} className="flex gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[#f3ece0]">{i.image ? <img src={i.image} alt={i.name} className="h-full w-full object-cover" /> : null}</div>
                  <div className="flex-1"><p className="line-clamp-1">{i.name}</p><p className="text-muted-foreground">Qty {i.quantity} · {inr(i.price)}</p></div>
                  <div className="font-medium">{inr(i.price * i.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : inr(shipping)}</span></div>
              <div className="flex justify-between text-base font-semibold border-t border-border pt-2"><span>Total</span><span>{inr(total)}</span></div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-5" disabled={placing}>
              {placing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing order...</> : <><Lock className="mr-2 h-4 w-4" /> Place Order</>}
            </Button>
            {method === 'razorpay_link' && <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="h-3 w-3" /> Razorpay payment page opens after placing the order.</p>}
          </div>
        </div>
      </form>
    </div>
  )
}
