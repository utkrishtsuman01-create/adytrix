'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import ProductForm from '@/components/admin/product-form'

export default function EditProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(undefined)
  useEffect(() => { if (id) fetch(`/api/admin/products/${id}`).then((r) => r.json()).then((d) => setProduct(d.error ? null : d.product)) }, [id])
  if (product === undefined) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>
  if (product === null) return <div className="py-20 text-center">Product not found.</div>
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-[#B8862F]">← Back to products</Link>
      <h1 className="mt-3 font-display text-3xl mb-6">Edit Product</h1>
      <ProductForm initial={product} productId={id} />
    </div>
  )
}
