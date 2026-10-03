'use client'

import Link from 'next/link'
import { ShoppingBag, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/site/cart'
import { inr, discountPct } from '@/lib/format'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const pct = discountPct(product.mrp, product.discountedPrice)
  const img = (product.images && product.images[0]) || ''

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-[0_12px_40px_-12px_rgba(60,45,25,0.25)] hover:-translate-y-0.5">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[#f3ece0]">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[#B8862F] px-2.5 py-1 text-[11px] font-semibold text-white">{pct}% OFF</span>
        )}
        {product.trending && (
          <span className="absolute right-3 top-3 rounded-full bg-[#1f1a16] px-2.5 py-1 text-[11px] font-medium text-[#f4ead6]">Trending</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.categoryName && <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{product.categoryName}</span>}
        <Link href={`/products/${product.slug}`} className="font-medium text-sm sm:text-[15px] leading-snug line-clamp-2 hover:text-[#B8862F] transition-colors">{product.name}</Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">{inr(product.discountedPrice)}</span>
          {product.mrp > product.discountedPrice && <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>}
        </div>
        <div className="mt-auto pt-4 flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => { addItem(product, 1); toast.success('Added to cart', { description: product.name }) }}>
            <ShoppingBag className="mr-1.5 h-4 w-4" /> Add
          </Button>
          <Button size="sm" variant="outline" asChild aria-label="View product">
            <Link href={`/products/${product.slug}`}><Eye className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
