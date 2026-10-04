'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [redirect, setRedirect] = useState('/')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('redirect')
    if (p) setRedirect(p)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')
      toast.success('Account created!')
      router.push(redirect)
      router.refresh()
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="container max-w-md py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="font-display text-3xl text-center">Create Account</h1>
        <p className="mt-2 text-center text-muted-foreground">Join ADYTRIX for a premium shopping experience</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div><Label htmlFor="name">Full Name</Label><Input id="name" required value={form.name} onChange={set('name')} className="mt-1.5" /></div>
          <div><Label htmlFor="email">Email Address</Label><Input id="email" type="email" required value={form.email} onChange={set('email')} className="mt-1.5" /></div>
          <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" required value={form.phone} onChange={set('phone')} className="mt-1.5" placeholder="10-digit mobile number" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={6} value={form.password} onChange={set('password')} className="mt-1.5" placeholder="At least 6 characters" /></div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-[#5f8aa1] hover:underline">Sign in</Link></p>
      </div>
    </div>
  )
}
