'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingBag, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/site/cart'

export default function ProductActions({ product }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const disabled = !product.available

  const add = () => { addItem(product, qty); toast.success('Added to cart', { description: product.name }) }
  const buyNow = () => { addItem(product, qty); router.push('/checkout') }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center rounded-lg border border-border">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 hover:bg-muted rounded-l-lg" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
          <span className="w-12 text-center font-medium">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="p-2.5 hover:bg-muted rounded-r-lg" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1 h-12" onClick={add} disabled={disabled}><ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart</Button>
        <Button size="lg" variant="outline" className="flex-1 h-12 border-[#B8862F] text-[#8A6420] hover:bg-[#B8862F] hover:text-white" onClick={buyNow} disabled={disabled}><Zap className="mr-2 h-5 w-5" /> Buy Now</Button>
      </div>
    </div>
  )
}
