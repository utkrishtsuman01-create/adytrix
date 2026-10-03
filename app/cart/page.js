'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/site/cart'
import { inr } from '@/lib/format'

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, ready } = useCart()
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 59
  const total = subtotal + shipping

  if (ready && items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><ShoppingBag className="h-9 w-9" /></div>
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven’t added anything yet.</p>
        <Button asChild size="lg" className="mt-6"><Link href="/shop">Continue Shopping</Link></Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <Link href={`/products/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#f3ece0]">
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <Link href={`/products/${item.slug}`} className="font-medium leading-snug line-clamp-2 hover:text-[#B8862F]">{item.name}</Link>
                  <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive" aria-label="Remove item"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{inr(item.price)} each</div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-border">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-2 hover:bg-muted rounded-l-lg" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-2 hover:bg-muted rounded-r-lg" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="font-semibold">{inr(item.price * item.quantity)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-6 sticky top-28">
            <h2 className="font-display text-xl mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : inr(shipping)}</span></div>
              {shipping > 0 && <p className="text-xs text-muted-foreground">Add {inr(999 - subtotal)} more for free shipping.</p>}
              <div className="border-t border-border pt-3 flex justify-between text-base font-semibold"><span>Total</span><span>{inr(total)}</span></div>
            </div>
            <Button asChild size="lg" className="w-full mt-5"><Link href="/checkout">Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="ghost" className="w-full mt-2"><Link href="/shop">Continue Shopping</Link></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
