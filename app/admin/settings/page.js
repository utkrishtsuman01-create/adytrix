'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pw) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setPw({ currentPassword: '', newPassword: '' }); toast.success('Password updated')
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/admin/login') }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl mb-6">Settings</h1>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl mb-5"><KeyRound className="h-5 w-5 text-[#B8862F]" /> Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div><Label htmlFor="cp">Current Password</Label><Input id="cp" type="password" required value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} className="mt-1.5" /></div>
          <div><Label htmlFor="np">New Password</Label><Input id="np" type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} className="mt-1.5" /></div>
          <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}</Button>
        </form>
      </section>
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl mb-3">Session</h2>
        <Button variant="outline" onClick={logout} className="text-destructive border-destructive/40 hover:bg-destructive hover:text-white"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </section>
    </div>
  )
}
