'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MAX_IMAGES = 5

export default function ProductForm({ initial, productId }) {
  const router = useRouter()
  const fileRef = useRef(null)
  const [categories, setCategories] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name || '', categoryId: initial?.categoryId || '', mrp: initial?.mrp || '',
    discountedPrice: initial?.discountedPrice || '', description: initial?.description || '',
    featured: initial?.featured || false, trending: initial?.trending || false,
    available: initial?.available !== false, stock: initial?.stock ?? 50,
    images: initial?.images || [],
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => { fetch('/api/admin/categories').then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => {}) }, [])

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (form.images.length + files.length > MAX_IMAGES) { toast.error(`Maximum ${MAX_IMAGES} images allowed`); if (fileRef.current) fileRef.current.value = ''; return }
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('images', f))
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      set('images', [...form.images, ...data.urls])
      toast.success(`${data.urls.length} image(s) uploaded`)
    } catch (err) { toast.error(err.message) } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const removeImage = (url) => set('images', form.images.filter((u) => u !== url))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.categoryId) { toast.error('Please select a category'); return }
    setSaving(true)
    try {
      const payload = { ...form, mrp: Number(form.mrp), discountedPrice: Number(form.discountedPrice), stock: Number(form.stock) }
      const res = await fetch(productId ? `/api/admin/products/${productId}` : '/api/admin/products', {
        method: productId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(productId ? 'Product updated' : 'Product created')
      router.push('/admin/products')
      router.refresh()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div><Label htmlFor="name">Product Name</Label><Input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1.5" /></div>
        <div>
          <Label>Category</Label>
          <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><Label htmlFor="mrp">MRP (₹)</Label><Input id="mrp" type="number" min="1" required value={form.mrp} onChange={(e) => set('mrp', e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="dp">Discounted Price (₹)</Label><Input id="dp" type="number" min="1" required value={form.discountedPrice} onChange={(e) => set('discountedPrice', e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="stock">Stock</Label><Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="mt-1.5" /></div>
        </div>
        <div><Label htmlFor="desc">Description</Label><Textarea id="desc" rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} className="mt-1.5" placeholder="Detailed product description..." /></div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <Label>Product Images (up to {MAX_IMAGES})</Label>
        <div className="mt-3 flex flex-wrap gap-3">
          {form.images.map((url) => (
            <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border group">
              <img src={url} alt="Product" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {form.images.length < MAX_IMAGES && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-[#B8862F] hover:text-[#B8862F]">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ImagePlus className="h-5 w-5" /><span className="text-xs">Add</span></>}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={onFiles} />
        <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, WebP or GIF. Max 5 MB each. {form.images.length}/{MAX_IMAGES} added.</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 grid sm:grid-cols-3 gap-4">
        <div className="flex items-center justify-between"><Label htmlFor="featured">Featured</Label><Switch id="featured" checked={form.featured} onCheckedChange={(v) => set('featured', v)} /></div>
        <div className="flex items-center justify-between"><Label htmlFor="trending">Trending</Label><Switch id="trending" checked={form.trending} onCheckedChange={(v) => set('trending', v)} /></div>
        <div className="flex items-center justify-between"><Label htmlFor="available">Available</Label><Switch id="available" checked={form.available} onCheckedChange={(v) => set('available', v)} /></div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving || uploading}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (productId ? 'Update Product' : 'Create Product')}</Button>
        <Button type="button" size="lg" variant="outline" onClick={() => router.push('/admin/products')}>Cancel</Button>
      </div>
    </form>
  )
}
