'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Facebook, Instagram, Mail, Phone } from 'lucide-react'
import { NAV, POLICIES, SOCIAL, BRAND, TAGLINE } from '@/lib/site'
import { LOGO } from '@/lib/assets'

export default function Footer() {
  const pathname = usePathname()
  const [site, setSite] = useState(null)
  useEffect(() => { fetch('/api/site-config').then((r) => r.json()).then(setSite).catch(() => {}) }, [])
  if (pathname && pathname.startsWith('/admin')) return null
  const nav = site?.header?.navItems || NAV
  const instagram = site?.footer?.instagram || SOCIAL.instagram
  const facebook = site?.footer?.facebook || SOCIAL.facebook
  const phone = site?.footer?.phone || ''
  const email = site?.footer?.email || ''
  const logo = site?.header?.logoUrl || LOGO
  const tagline = site?.footer?.tagline || TAGLINE
  const description = site?.footer?.description || 'Premium handcrafted decor and lifestyle products — artificial flowers, festive torans, hangings, bells, handbags and shirts.'
  return (
    <footer className="mt-20 bg-[#11181f] text-[#e4f0f5]">
      <div className="container py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ADYTRIX brand logo" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
            <div>
              <div className="font-display text-2xl tracking-[0.2em]">{BRAND}</div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-[#5f8aa1]">{tagline}</div>
            </div>
          </div>
          <p className="text-sm text-[#b7cad4] leading-relaxed">{description}</p>
          <div className="flex gap-3 pt-2">
            <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="ADYTRIX on Facebook" className="h-9 w-9 rounded-full border border-[#2b343a] flex items-center justify-center hover:bg-[#5f8aa1] hover:text-white transition-colors"><Facebook className="h-4 w-4" /></a>
            <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="ADYTRIX on Instagram" className="h-9 w-9 rounded-full border border-[#2b343a] flex items-center justify-center hover:bg-[#5f8aa1] hover:text-white transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="/contact" aria-label="Contact ADYTRIX" className="h-9 w-9 rounded-full border border-[#2b343a] flex items-center justify-center hover:bg-[#5f8aa1] hover:text-white transition-colors"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg mb-4">Explore</h3>
          <ul className="space-y-2.5 text-sm text-[#b7cad4]">
            {nav.map((n) => (<li key={n.href}><Link href={n.href} className="hover:text-[#5f8aa1] transition-colors">{n.label}</Link></li>))}
            <li><Link href="/contact" className="hover:text-[#5f8aa1] transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg mb-4">Policies</h3>
          <ul className="space-y-2.5 text-sm text-[#b7cad4]">
            {POLICIES.map((p) => (<li key={p.href}><Link href={p.href} className="hover:text-[#5f8aa1] transition-colors">{p.label}</Link></li>))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg mb-4">Contact & Social</h3>
          <div className="space-y-2.5 text-sm text-[#b7cad4]">
            {phone && <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-2 hover:text-[#5f8aa1]"><Phone className="h-4 w-4" /> {phone}</a>}
            {email && <a href={`mailto:${email}`} className="flex items-center gap-2 break-all hover:text-[#5f8aa1]"><Mail className="h-4 w-4 shrink-0" /> {email}</a>}
          </div>
          <div className="mt-4 space-y-2">
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-[#5f8aa1] hover:underline">Instagram →</a>
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-[#5f8aa1] hover:underline">Facebook →</a>
          </div>
        </div>
      </div>
      <div className="border-t border-[#2b241e]">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8fa5b0]">
          <p>© {new Date().getFullYear()} {BRAND}. All rights reserved.</p>
          <p>Crafted for a beautiful home.</p>
        </div>
      </div>
    </footer>
  )
}
