'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, Package, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(undefined)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) { router.replace('/login?redirect=/profile'); return }
      setUser(d.user); setName(d.user.name || ''); setPhone(d.user.phone || '')
    })
  }, [router])

  const saveProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true)
    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setUser(data.user); toast.success('Profile updated')
    } catch (err) { toast.error(err.message) } finally { setSavingProfile(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault(); setSavingPw(true)
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pw) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not change password')
      setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed')
    } catch (err) { toast.error(err.message) } finally { setSavingPw(false) }
  }

  if (user === undefined) return <div className="container py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="font-display text-3xl sm:text-4xl">My Account</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link href="/orders"><Package className="mr-2 h-4 w-4" /> My Orders</Link></Button>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl mb-5"><User className="h-5 w-5 text-[#B8862F]" /> Profile Information</h2>
        <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
          <div><Label htmlFor="name">Full Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" /></div>
          <div className="sm:col-span-2"><Label>Email</Label><Input value={user.email} disabled className="mt-1.5 bg-muted" /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={savingProfile}>{savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}</Button></div>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl mb-5"><KeyRound className="h-5 w-5 text-[#B8862F]" /> Change Password</h2>
        <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-4">
          <div><Label htmlFor="cp">Current Password</Label><Input id="cp" type="password" required value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} className="mt-1.5" /></div>
          <div><Label htmlFor="np">New Password</Label><Input id="np" type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} className="mt-1.5" /></div>
          <div className="sm:col-span-2"><Button type="submit" variant="outline" disabled={savingPw}>{savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}</Button></div>
        </form>
      </section>
    </div>
  )
}
