'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Lock, CreditCard, Banknote, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/components/site/cart'
import { startRazorpayPayment } from '@/lib/razorpay-client'
import { inr } from '@/lib/format'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clear, ready } = useCart()
  const [user, setUser] = useState(undefined)
  const [placing, setPlacing] = useState(false)
  const [method, setMethod] = useState('razorpay')
  const [guestPassword, setGuestPassword] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', country: 'India' })

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setUser(d.user)
      if (d.user) setForm((f) => ({ ...f, name: d.user.name || '', email: d.user.email || '', phone: d.user.phone || '' }))
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
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryAddress: form,
          paymentMethod: method,
          ...(!user ? { password: guestPassword } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(data.error || 'Please sign in to continue')
          router.push('/login?redirect=/checkout')
          return
        }
        throw new Error(data.error || 'Could not create order')
      }
      clear()
      const created = data.order
      if (method === 'razorpay') {
        try {
          const result = await startRazorpayPayment({ orderId: created.id, prefill: { name: form.name, email: form.email, phone: form.phone } })
          if (result.status === 'paid') toast.success('Payment successful! Order confirmed.')
          else if (result.status === 'dismissed') toast('Payment cancelled — you can pay later from My Orders.')
          else toast.error('Payment not completed. You can retry from My Orders.')
        } catch (e) {
          toast.error(e.message || 'Could not start payment')
        }
      } else {
        toast.success('Order placed!', { description: 'Your order has been received.' })
      }
      router.push(`/orders/${created.id}`)
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
              {!user && (
                <div className="sm:col-span-2 rounded-lg bg-[#eaf3f7] p-4">
                  <Label htmlFor="guestPassword">Password for future login</Label>
                  <Input id="guestPassword" type="password" required minLength={6} value={guestPassword} onChange={(e) => setGuestPassword(e.target.value)} className="mt-1.5 bg-white" placeholder="At least 6 characters" />
                  <p className="mt-1.5 text-xs text-muted-foreground">No separate signup is needed. We’ll create your customer account automatically after you place this order.</p>
                  <p className="mt-2 text-xs text-muted-foreground">Already have an account? <Link href="/login?redirect=/checkout" className="font-medium text-[#5f8aa1] hover:underline">Sign in</Link></p>
                </div>
              )}
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
                <RadioGroupItem value="razorpay" id="rzp" className="mt-0.5" />
                <div><div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-[#5f8aa1]" /> Pay Online (Razorpay · Test Mode)</div><p className="text-sm text-muted-foreground mt-1">Secure card / UPI / netbanking payment via Razorpay. Your order is confirmed after payment is verified on our server.</p></div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
                <div><div className="flex items-center gap-2 font-medium"><Banknote className="h-4 w-4 text-[#5f8aa1]" /> Cash on Delivery</div><p className="text-sm text-muted-foreground mt-1">Pay in cash when your order is delivered.</p></div>
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
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[#e7f0f4]">{i.image ? <img src={i.image} alt={i.name} className="h-full w-full object-cover" /> : null}</div>
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
            {method === 'razorpay' && <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Secure Razorpay payment opens after you place the order.</p>}
          </div>
        </div>
      </form>
    </div>
  )
}
