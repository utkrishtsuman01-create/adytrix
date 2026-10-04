'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [redirect, setRedirect] = useState('/')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('redirect')
    if (p) setRedirect(p)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      toast.success('Welcome back!')
      router.push(redirect)
      router.refresh()
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="container max-w-md py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="font-display text-3xl text-center">Welcome Back</h1>
        <p className="mt-2 text-center text-muted-foreground">Sign in to your ADYTRIX account</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div><Label htmlFor="email">Email Address</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" /></div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Don’t have an account? <Link href="/signup" className="font-medium text-[#5f8aa1] hover:underline">Create one</Link></p>
      </div>
    </div>
  )
}
