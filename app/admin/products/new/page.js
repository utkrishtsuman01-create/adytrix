'use client'

import Link from 'next/link'
import ProductForm from '@/components/admin/product-form'

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-[#B8862F]">← Back to products</Link>
      <h1 className="mt-3 font-display text-3xl mb-6">Add Product</h1>
      <ProductForm />
    </div>
  )
}
