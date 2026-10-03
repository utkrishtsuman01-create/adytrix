import Breadcrumbs from '@/components/site/breadcrumbs'
import { Facebook, Instagram } from 'lucide-react'
import { SOCIAL } from '@/lib/site'

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with ADYTRIX. Reach us on Instagram and Facebook for product queries, orders and support.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <h1 className="mt-4 font-display text-4xl">Contact Us</h1>
      <p className="mt-3 text-muted-foreground">We’d love to hear from you. For product queries, order support or collaborations, reach out through our social channels and we’ll get back to you as soon as possible.</p>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Instagram className="h-6 w-6" /></div>
          <div><p className="font-medium">Instagram</p><p className="text-sm text-muted-foreground">@ady_trix</p></div>
        </a>
        <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><Facebook className="h-6 w-6" /></div>
          <div><p className="font-medium">Facebook</p><p className="text-sm text-muted-foreground">ADYTRIX on Facebook</p></div>
        </a>
      </div>
    </div>
  )
}
