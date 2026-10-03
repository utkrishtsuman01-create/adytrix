import { Suspense } from 'react'
import ShopClient from './shop-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop All Products',
  description: 'Browse the complete ADYTRIX collection — artificial flowers, festive torans, decorative hangings, brass bells, handbags and shirts. Filter by category and price.',
  alternates: { canonical: '/shop' },
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center text-muted-foreground">Loading products...</div>}>
      <ShopClient />
    </Suspense>
  )
}
