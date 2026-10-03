'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { inr } from '@/lib/format'

export default function AdminProductsPage() {
  const [products, setProducts] = useState(null)

  const load = () => fetch('/api/admin/products').then((r) => r.json()).then((d) => setProducts(d.products || [])).catch(() => setProducts([]))
  useEffect(() => { load() }, [])

  const toggle = async (p, field) => {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, [field]: !p[field] }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, [field]: !x[field] } : x))
    } catch (err) { toast.error(err.message) }
  }
  const remove = async (id) => {
    try { const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); setProducts((prev) => prev.filter((x) => x.id !== id)); toast.success('Product deleted') }
    catch (err) { toast.error(err.message) }
  }

  if (!products) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Products</h1>
        <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" /> Add Product</Link></Button>
      </div>
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">No products yet. Add your first product.</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f3ece0]">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : null}</div>
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium line-clamp-1">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.categoryName} · {inr(p.discountedPrice)} <span className="line-through">{inr(p.mrp)}</span></p>
              </div>
              <label className="flex items-center gap-2 text-xs"><Switch checked={!!p.featured} onCheckedChange={() => toggle(p, 'featured')} /> Featured</label>
              <label className="flex items-center gap-2 text-xs"><Switch checked={!!p.trending} onCheckedChange={() => toggle(p, 'trending')} /> Trending</label>
              <label className="flex items-center gap-2 text-xs"><Switch checked={p.available !== false} onCheckedChange={() => toggle(p, 'available')} /> Available</label>
              <div className="flex gap-2">
                <Button asChild size="icon" variant="outline"><Link href={`/admin/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="outline" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete this product?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. “{p.name}” will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(p.id)} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
