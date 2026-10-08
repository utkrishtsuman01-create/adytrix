'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Save, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

const TYPES = {
  featured: 'Featured products',
  categories: 'Shop by category',
  trending: 'Trending products',
  story: 'Brand story',
  promises: 'Promise cards',
  social: 'Social section',
  custom: 'Custom section',
}

const makeSlide = () => ({
  image: '',
  eyebrow: 'Handcrafted festive & lifestyle decor',
  title: 'Where Tradition Meets Beauty',
  description: 'Discover ADYTRIX — premium artificial flowers, festive torans, decorative hangings and more.',
  buttonText: 'Shop Now',
  buttonHref: '/shop',
  secondaryText: 'Explore Collection',
  secondaryHref: '/categories',
})

const makeCustom = () => ({
  id: crypto.randomUUID(),
  type: 'custom',
  enabled: true,
  eyebrow: 'Your section',
  title: 'New section',
  text: 'Add your own content here.',
  text2: '',
  image: '',
  imagePosition: 'right',
  buttonText: '',
  buttonHref: '/',
})

async function uploadImage(file) {
  if (!file) return ''
  const form = new FormData()
  form.append('images', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.urls?.[0] || ''
}

export default function AdminWebsitePage() {
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [dragNotice, setDragNotice] = useState('')

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => toast.error('Could not load website settings'))
  }, [])

  const update = (fn) => setConfig((prev) => ({ ...prev, ...fn(prev) }))

  const updateNested = (key, patch) => update((prev) => ({ [key]: { ...prev[key], ...patch } }))

  const updateSection = (index, patch) => update((prev) => ({
    sections: prev.sections.map((s, i) => i === index ? { ...s, ...patch } : s),
  }))

  const moveSection = (index, direction) => update((prev) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= prev.sections.length) return {}
    const sections = [...prev.sections]
    ;[sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]]
    return { sections }
  })

  const removeSection = (index) => update((prev) => ({ sections: prev.sections.filter((_, i) => i !== index) }))

  const addCustomSection = () => update((prev) => ({ sections: [...prev.sections, makeCustom()] }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setConfig(data)
      toast.success('Website changes published')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (file, onDone, key) => {
    if (!file) return
    setUploading(key)
    try {
      const url = await uploadImage(file)
      onDone(url)
      toast.success('Image uploaded')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploading('')
    }
  }

  if (!config) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#B8862F]" /></div>

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#1b1613] p-6 text-[#f4ead6] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-3xl">Website Editor</h1>
          <p className="mt-1 text-sm text-[#c9bca5]">Edit the storefront without touching code. Only admin accounts can publish these changes.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="bg-[#B8862F] text-white hover:bg-[#9e7725]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Publish changes
          </Button>
        </div>
      </div>

      {dragNotice && <p className="text-sm text-muted-foreground">{dragNotice}</p>}

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl">Announcement bar</h2>
            <p className="text-sm text-muted-foreground">The strip at the very top of the store.</p>
          </div>
          <Switch checked={config.announcement?.enabled !== false} onCheckedChange={(enabled) => updateNested('announcement', { enabled })} />
        </div>
        <Label>Text</Label>
        <Input className="mt-2" value={config.announcement?.text || ''} onChange={(e) => updateNested('announcement', { text: e.target.value })} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5">
          <h2 className="font-display text-2xl">Header & navigation</h2>
          <p className="text-sm text-muted-foreground">Change the logo and every visible navigation label/link.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <div>
            <Label>Logo</Label>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-[#1b1613] p-4">
              {config.header?.logoUrl ? (
                <img
                  src={config.header.logoUrl}
                  alt="Current logo"
                  className="mx-auto max-h-[240px] max-w-[240px] object-contain"
                  style={{
                    width: `${Math.min(240, Math.max(32, Number(config.header?.logoWidth) || 88))}px`,
                    height: `${Math.min(240, Math.max(32, Number(config.header?.logoHeight) || 88))}px`,
                  }}
                />
              ) : <div className="h-28" />}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Logo width (px)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min="32"
                  max="240"
                  value={config.header?.logoWidth ?? 88}
                  onChange={(e) => updateNested('header', { logoWidth: e.target.value })}
                />
              </div>
              <div>
                <Label>Logo height (px)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min="32"
                  max="240"
                  value={config.header?.logoHeight ?? 88}
                  onChange={(e) => updateNested('header', { logoHeight: e.target.value })}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Set the width and height independently. Allowed range: 32–240 px.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input value={config.header?.logoUrl || ''} onChange={(e) => updateNested('header', { logoUrl: e.target.value })} placeholder="/api/images/..." />
              <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                <ImagePlus className="mr-2 h-4 w-4" /> Upload logo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], (url) => updateNested('header', { logoUrl: url }), 'logo')} />
              </label>
            </div>
          </div>
          <div>
            <Label>Navigation items</Label>
            <div className="mt-2 space-y-2">
              {(config.header?.navItems || []).map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                  <Input value={item.label} onChange={(e) => updateNested('header', { navItems: config.header.navItems.map((n, j) => j === i ? { ...n, label: e.target.value } : n) })} />
                  <Input value={item.href} onChange={(e) => updateNested('header', { navItems: config.header.navItems.map((n, j) => j === i ? { ...n, href: e.target.value } : n) })} />
                  <Button size="icon" variant="outline" onClick={() => updateNested('header', { navItems: config.header.navItems.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => updateNested('header', { navItems: [...(config.header?.navItems || []), { label: 'New', href: '/' }] })}><Plus className="mr-2 h-4 w-4" /> Add navigation item</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl">Hero slider</h2>
            <p className="text-sm text-muted-foreground">Add, remove and reorder the large homepage images. Each slide can have its own text and buttons.</p>
          </div>
          <div className="flex gap-2">
            <Switch checked={config.hero?.enabled !== false} onCheckedChange={(enabled) => updateNested('hero', { enabled })} />
            <Button variant="outline" onClick={() => updateNested('hero', { slides: [...(config.hero?.slides || []), makeSlide()] })}><Plus className="mr-2 h-4 w-4" /> Add slide</Button>
          </div>
        </div>

        <div className="space-y-4">
          {(config.hero?.slides || []).map((slide, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Slide {i + 1}</p>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" disabled={i === 0} onClick={() => updateNested('hero', { slides: config.hero.slides.map((s, j, arr) => j === i - 1 ? arr[i] : j === i ? arr[i - 1] : s) })}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" disabled={i === config.hero.slides.length - 1} onClick={() => updateNested('hero', { slides: config.hero.slides.map((s, j, arr) => j === i ? arr[i + 1] : j === i + 1 ? arr[i] : s) })}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" className="text-destructive" onClick={() => updateNested('hero', { slides: config.hero.slides.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
                <div>
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    {slide.image ? <img src={slide.image} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                    {uploading === `hero-${i}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />} Upload image
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], (url) => updateNested('hero', { slides: config.hero.slides.map((s, j) => j === i ? { ...s, image: url } : s) }), `hero-${i}`)} />
                  </label>
                  <Input className="mt-2" value={slide.image} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s, j) => j === i ? { ...s, image: e.target.value } : s) })} placeholder="Image URL" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label>Eyebrow</Label><Input className="mt-1.5" value={slide.eyebrow} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, eyebrow:e.target.value}:s) })} /></div>
                  <div><Label>Title</Label><Input className="mt-1.5" value={slide.title} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, title:e.target.value}:s) })} /></div>
                  <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} className="mt-1.5" value={slide.description} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, description:e.target.value}:s) })} /></div>
                  <div><Label>Primary button</Label><Input className="mt-1.5" value={slide.buttonText} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, buttonText:e.target.value}:s) })} /></div>
                  <div><Label>Primary link</Label><Input className="mt-1.5" value={slide.buttonHref} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, buttonHref:e.target.value}:s) })} /></div>
                  <div><Label>Secondary button</Label><Input className="mt-1.5" value={slide.secondaryText} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, secondaryText:e.target.value}:s) })} /></div>
                  <div><Label>Secondary link</Label><Input className="mt-1.5" value={slide.secondaryHref} onChange={(e) => updateNested('hero', { slides: config.hero.slides.map((s,j) => j===i ? {...s, secondaryHref:e.target.value}:s) })} /></div>
                </div>
              </div>
            </div>
          ))}
          {!config.hero?.slides?.length && <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">No hero images yet. Add a slide above.</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5">
          <h2 className="font-display text-2xl">Homepage sections</h2>
          <p className="text-sm text-muted-foreground">Turn sections on/off and move them up or down. Add custom sections wherever you want.</p>
        </div>
        <div className="space-y-4">
          {(config.sections || []).map((section, i) => (
            <SectionEditor
              key={section.id || i}
              section={section}
              index={i}
              total={config.sections.length}
              onChange={(patch) => updateSection(i, patch)}
              onUp={() => moveSection(i, -1)}
              onDown={() => moveSection(i, 1)}
              onDelete={() => removeSection(i)}
              uploading={uploading}
              handleUpload={handleUpload}
            />
          ))}
        </div>
        <Button className="mt-4" variant="outline" onClick={addCustomSection}><Plus className="mr-2 h-4 w-4" /> Add custom section</Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Footer</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><Label>Tagline</Label><Input className="mt-1.5" value={config.footer?.tagline || ''} onChange={(e) => updateNested('footer', { tagline: e.target.value })} /></div>
          <div><Label>Public phone number</Label><Input className="mt-1.5" value={config.footer?.phone || ''} onChange={(e) => updateNested('footer', { phone: e.target.value })} placeholder="+91 ..." /></div>
          <div><Label>Public email address</Label><Input type="email" className="mt-1.5" value={config.footer?.email || ''} onChange={(e) => updateNested('footer', { email: e.target.value })} placeholder="hello@yourbusiness.com" /></div>
          <div><Label>Instagram URL</Label><Input className="mt-1.5" value={config.footer?.instagram || ''} onChange={(e) => updateNested('footer', { instagram: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} className="mt-1.5" value={config.footer?.description || ''} onChange={(e) => updateNested('footer', { description: e.target.value })} /></div>
          <div><Label>Facebook URL</Label><Input className="mt-1.5" value={config.footer?.facebook || ''} onChange={(e) => updateNested('footer', { facebook: e.target.value })} /></div>
          <p className="md:col-span-2 text-xs text-muted-foreground">Use the public business contact details here. Do not enter the private admin login phone number or password.</p>
        </div>
      </section>
    </div>
  )
}

function SectionEditor({ section, index, total, onChange, onUp, onDown, onDelete, uploading, handleUpload }) {
  const isTextual = ['featured', 'categories', 'trending'].includes(section.type)
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-[0.2em] text-[#B8862F]">{TYPES[section.type] || 'Section'}</div>
          <Input className="mt-1.5 font-medium" value={section.title || ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="Section title" />
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={section.enabled !== false} onCheckedChange={(enabled) => onChange({ enabled })} /> Visible</label>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" disabled={index === 0} onClick={onUp}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" disabled={index === total - 1} onClick={onDown}><ArrowDown className="h-4 w-4" /></Button>
          {section.type === 'custom' && <Button size="icon" variant="outline" className="text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div><Label>Eyebrow</Label><Input className="mt-1.5" value={section.eyebrow || ''} onChange={(e) => onChange({ eyebrow: e.target.value })} /></div>
        {isTextual && <div><Label>Section link</Label><Input className="mt-1.5" value={section.href || '/shop'} onChange={(e) => onChange({ href: e.target.value })} placeholder="/shop" /></div>}
      </div>

      {['story', 'custom'].includes(section.type) && (
        <div className="mt-4 space-y-4">
          <div><Label>Main text</Label><Textarea rows={3} className="mt-1.5" value={section.text || ''} onChange={(e) => onChange({ text: e.target.value })} /></div>
          <div><Label>Second text</Label><Textarea rows={3} className="mt-1.5" value={section.text2 || ''} onChange={(e) => onChange({ text2: e.target.value })} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Section image</Label>
              <div className="mt-2 overflow-hidden rounded-lg bg-muted aspect-[4/3]">
                {section.image ? <img src={section.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                <ImagePlus className="mr-2 h-4 w-4" /> Upload image
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], (url) => onChange({ image: url }), `section-${section.id}`)} />
              </label>
              <Input className="mt-2" value={section.image || ''} onChange={(e) => onChange({ image: e.target.value })} placeholder="Image URL" />
            </div>
            <div className="space-y-3">
              {section.type === 'custom' && <div><Label>Image position</Label><select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={section.imagePosition || 'right'} onChange={(e) => onChange({ imagePosition: e.target.value })}><option value="right">Right</option><option value="left">Left</option></select></div>}
              <div><Label>Button text</Label><Input className="mt-1.5" value={section.buttonText || ''} onChange={(e) => onChange({ buttonText: e.target.value })} /></div>
              <div><Label>Button link</Label><Input className="mt-1.5" value={section.buttonHref || '/about'} onChange={(e) => onChange({ buttonHref: e.target.value })} /></div>
            </div>
          </div>
        </div>
      )}

      {section.type === 'promises' && (
        <div className="mt-4 space-y-3">
          {(section.items || []).map((item, j) => (
            <div key={j} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <Input value={item.title} onChange={(e) => onChange({ items: section.items.map((x, k) => k === j ? { ...x, title: e.target.value } : x) })} />
              <Input value={item.text} onChange={(e) => onChange({ items: section.items.map((x, k) => k === j ? { ...x, text: e.target.value } : x) })} />
              <Button size="icon" variant="outline" onClick={() => onChange({ items: section.items.filter((_, k) => k !== j) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => onChange({ items: [...(section.items || []), { title: 'New promise', text: 'Add supporting text.' }] })}><Plus className="mr-2 h-4 w-4" /> Add promise</Button>
        </div>
      )}

      {section.type === 'social' && (
        <div className="mt-4"><Label>Social description</Label><Textarea rows={2} className="mt-1.5" value={section.text || ''} onChange={(e) => onChange({ text: e.target.value })} /></div>
      )}
    </div>
  )
}
