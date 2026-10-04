import Breadcrumbs from '@/components/site/breadcrumbs'
import { Facebook, Instagram, Mail, Phone } from 'lucide-react'
import { getSiteConfig } from '@/lib/site-config'
import { SOCIAL } from '@/lib/site'

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with ADYTRIX by phone, email, Instagram or Facebook for product queries, orders and support.',
  alternates: { canonical: '/contact' },
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const site = await getSiteConfig()
  const phone = site.footer?.phone || ''
  const email = site.footer?.email || ''
  const instagram = site.footer?.instagram || SOCIAL.instagram
  const facebook = site.footer?.facebook || SOCIAL.facebook

  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <div className="mt-4">
        <span className="text-xs uppercase tracking-[0.3em] text-[#B8862F]">We’re here to help</span>
        <h1 className="mt-2 font-display text-4xl">Contact Us</h1>
        <p className="mt-3 text-muted-foreground">
          For product queries, order support, collaborations or anything else, contact ADYTRIX directly.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {phone && (
          <a href={`tel:${phone.replace(/[^+\\d]/g, '')`} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Phone className="h-6 w-6" /></div>
            <div><p className="font-medium">Call us</p><p className="text-sm text-muted-foreground">{phone}</p></div>
          </a>
        )}

        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Mail className="h-6 w-6" /></div>
            <div><p className="font-medium">Email us</p><p className="break-all text-sm text-muted-foreground">{email}</p></div>
          </a>
        )}

        <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Instagram className="h-6 w-6" /></div>
          <div><p className="font-medium">Instagram</p><p className="text-sm text-muted-foreground">@ady_trix</p></div>
        </a>

        <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Facebook className="h-6 w-6" /></div>
          <div><p className="font-medium">Facebook</p><p className="text-sm text-muted-foreground">ADYTRIX on Facebook</p></div>
        </a>
      </div>
    </div>
  )
}
