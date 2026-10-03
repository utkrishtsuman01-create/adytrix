'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', image: '', active: true })
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/admin/categories').then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => setCategories([]))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', image: '', active: true }); setOpen(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '', image: c.image || '', active: c.active !== false }); setOpen(true) }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories', {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(editing ? 'Category updated' : 'Category created'); setOpen(false); load()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }
  const toggleActive = async (c) => {
    try { await fetch(`/api/admin/categories/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !c.active }) }); load() }
    catch { toast.error('Failed to update') }
  }

  if (!categories) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Categories</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-32 bg-[#f3ece0]">{c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : null}</div>
            <div className="p-4">
              <div className="flex items-center justify-between"><h2 className="font-medium">{c.name}</h2><Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button></div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
              <label className="mt-3 flex items-center gap-2 text-xs"><Switch checked={c.active !== false} onCheckedChange={() => toggleActive(c)} /> {c.active !== false ? 'Active' : 'Inactive'}</label>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div><Label htmlFor="cname">Name</Label><Input id="cname" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" /></div>
            <div><Label htmlFor="cdesc">Description</Label><Textarea id="cdesc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1.5" /></div>
            <div><Label htmlFor="cimg">Image URL</Label><Input id="cimg" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="mt-1.5" placeholder="https://..." /></div>
            <label className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} /> Active</label>
            <DialogFooter><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
