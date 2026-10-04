'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingBag, User, LogOut, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useCart } from '@/components/site/cart'
import { NAV, BRAND } from '@/lib/site'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { count } = useCart()
  const [user, setUser] = useState(null)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {})
  }, [])

  if (pathname && pathname.startsWith('/admin')) return null

  const submitSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    setSearchOpen(false)
    setMobileOpen(false)
    router.push(`/shop?search=${encodeURIComponent(q.trim())}`)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-[#1f1a16] text-[#f4ead6] text-center text-xs sm:text-sm py-2 px-4 tracking-wide">
        Handcrafted with love · Free shipping on orders over ₹999
      </div>

      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-20 sm:h-24 items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetTitle className="font-display text-2xl tracking-[0.2em] mb-6">{BRAND}</SheetTitle>
                <form onSubmit={submitSearch} className="mb-6">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
                </form>
                <nav className="flex flex-col gap-1">
                  {NAV.map((n) => (
                    <Link key={n.href} href={n.href} onClick={() => setMobileOpen(false)} className="py-3 text-base font-medium border-b border-border/60">{n.label}</Link>
                  ))}
                </nav>
                <div className="mt-6 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link href="/profile" onClick={() => setMobileOpen(false)} className="py-2">My Profile</Link>
                      <Link href="/orders" onClick={() => setMobileOpen(false)} className="py-2">My Orders</Link>
                      <button onClick={logout} className="py-2 text-left text-destructive">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}><Button className="w-full" variant="outline">Login</Button></Link>
                      <Link href="/signup" onClick={() => setMobileOpen(false)}><Button className="w-full">Sign Up</Button></Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="w-28 shrink-0 sm:w-36" aria-hidden="true" />

          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-foreground/80 hover:text-[#B8862F] transition-colors">{n.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}><Search className="h-5 w-5" /></Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account"><User className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium truncate">{user.name}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/orders"><Package className="mr-2 h-4 w-4" />My Orders</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hidden sm:block"><Button variant="ghost" size="icon" aria-label="Login"><User className="h-5 w-5" /></Button></Link>
            )}
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" aria-label="Cart"><ShoppingBag className="h-5 w-5" /></Button>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-[#B8862F] text-white text-[11px] font-semibold flex items-center justify-center">{count}</span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border bg-background">
            <form onSubmit={submitSearch} className="container py-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for torans, flowers, handbags..." className="border-0 focus-visible:ring-0 shadow-none" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen(false)}><X className="h-4 w-4" /></Button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
