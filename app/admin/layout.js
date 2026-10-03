'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, ShoppingCart, Package, Tags, Users, Settings, LogOut, Loader2, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { BRAND } from '@/lib/site'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: Tags },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

function SidebarContent({ pathname, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-5 border-b border-[#2b241e]">
        <div className="font-display text-xl tracking-[0.2em] text-[#f4ead6]">{BRAND}</div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#B8862F] mt-0.5">Admin Panel</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
          return (
            <Link key={n.href} href={n.href} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-[#B8862F] text-white' : 'text-[#c9bca5] hover:bg-[#2b241e] hover:text-[#f4ead6]'}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[#2b241e]">
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#c9bca5] hover:bg-[#2b241e] hover:text-red-300"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState('loading')
  const [open, setOpen] = useState(false)

  const isLogin = pathname === '/admin/login'

  useEffect(() => {
    if (isLogin) { setState('ok'); return }
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (d.user && d.user.role === 'admin') setState('ok')
      else { setState('denied'); router.replace('/admin/login') }
    }).catch(() => { setState('denied'); router.replace('/admin/login') })
  }, [isLogin, pathname, router])

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/admin/login') }

  if (isLogin) return <div className="min-h-screen bg-[#faf4e9]">{children}</div>
  if (state !== 'ok') return <div className="min-h-screen flex items-center justify-center bg-[#faf4e9]"><Loader2 className="h-6 w-6 animate-spin text-[#B8862F]" /></div>

  return (
    <div className="min-h-screen bg-[#f6f1e7]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-[#1b1613]"><SidebarContent pathname={pathname} onLogout={logout} /></aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden"><Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-[#1b1613] border-0"><SheetTitle className="sr-only">Admin menu</SheetTitle><SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} onLogout={logout} /></SheetContent>
          </Sheet>
          <h1 className="font-display text-lg">ADYTRIX Admin</h1>
          <Link href="/" target="_blank" className="ml-auto text-sm text-muted-foreground hover:text-[#B8862F]">View store →</Link>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
