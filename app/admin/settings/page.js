'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

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

  const resetOrders = async () => {
    const first = window.confirm(
      'This will permanently delete ALL orders, order history, payments, and customer accounts. Products, categories, website settings, images and the admin account will remain. Continue?'
    )
    if (!first) return

    const confirmation = window.prompt('Type RESET ALL to confirm this permanent reset.')
    if (confirmation !== 'RESET ALL') {
      if (confirmation !== null) toast.error('Reset cancelled. You must type RESET ALL exactly.')
      return
    }

    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      toast.success(
        `Reset complete: ${data.deleted?.orders || 0} orders and ${data.deleted?.customers || 0} customer accounts removed.`
      )
    } catch (err) {
      toast.error(err.message)
    } finally {
      setResetting(false)
    }
  }

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
      <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"><AlertTriangle className="h-5 w-5" /></div>
          <div className="flex-1">
            <h2 className="font-display text-xl text-red-900">Danger Zone</h2>
            <p className="mt-1 text-sm leading-relaxed text-red-800">
              Reset all order data for a fresh store/test environment. This permanently removes orders, payments, order history and customer accounts. Products, categories, images, website settings and the admin account are kept.
            </p>
            <Button
              variant="outline"
              onClick={resetOrders}
              disabled={resetting}
              className="mt-4 border-red-300 bg-white text-red-700 hover:bg-red-600 hover:text-white"
            >
              {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {resetting ? 'Resetting…' : 'Reset All Orders'}
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl mb-3">Session</h2>
        <Button variant="outline" onClick={logout} className="text-destructive border-destructive/40 hover:bg-destructive hover:text-white"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </section>
    </div>
  )
}
