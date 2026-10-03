import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/site/breadcrumbs'
import { CRAFT1, DECOR1 } from '@/lib/assets'

export const metadata = {
  title: 'About ADYTRIX',
  description: 'Learn the story behind ADYTRIX — a brand crafting premium artificial flowers, festive torans, decorative hangings and lifestyle products, trusted across Flipkart, Meesho and Shopsy.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
      <div className="mt-6 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-[#B8862F]">Our Story</span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">About ADYTRIX</h1>
          <p className="mt-5 text-muted-foreground leading-relaxed">ADYTRIX was born from a love for timeless Indian craftsmanship and a belief that beautiful decor should be accessible to every home. What began as a small collection of handcrafted festive pieces has grown into a trusted brand loved by thousands of customers across Flipkart, Meesho and Shopsy.</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">Today, we bring our full range — artificial flowers, festive torans, decorative hangings, brass-finish bells, handbags and shirts — to one premium destination, designed and curated with care.</p>
          <Button asChild className="mt-7"><Link href="/shop">Explore our collection</Link></Button>
        </div>
        <img src={CRAFT1} alt="Handcrafted decorative pieces that reflect the ADYTRIX aesthetic" className="w-full rounded-2xl object-cover aspect-[4/3] shadow-lg" />
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          { t: 'Craftsmanship', d: 'Every product is made with attention to detail using quality, long-lasting materials.' },
          { t: 'Trust', d: 'A proven track record across leading marketplaces and thousands of happy homes.' },
          { t: 'Value', d: 'Premium quality at honest, affordable prices — always.' },
        ].map((v, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-xl">{v.t}</h2><p className="mt-2 text-muted-foreground">{v.d}</p></div>
        ))}
      </div>

      <div className="mt-16 overflow-hidden rounded-2xl">
        <img src={DECOR1} alt="Elegant floral decor styled in a warm home setting by ADYTRIX" className="w-full object-cover aspect-[21/9]" />
      </div>
    </div>
  )
}
