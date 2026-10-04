import Link from 'next/link'
import { ArrowRight, Truck, ShieldCheck, Sparkles, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductCard from '@/components/site/product-card'
import { getFeaturedProducts, getTrendingProducts, getActiveCategories } from '@/lib/data'
import { HANGING1, CRAFT1, TORAN1, GARLAND1, HANGING2 } from '@/lib/assets'
import HeroSlider from '@/components/site/hero-slider'
import { SOCIAL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [featured, trending, categories] = await Promise.all([
    getFeaturedProducts(8),
    getTrendingProducts(8),
    getActiveCategories(),
  ])

  return (
    <div>
      {/* HERO */}
      <HeroSlider slides={[HANGING1, TORAN1, GARLAND1, HANGING2]}>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" /> Handcrafted festive & lifestyle decor
        </span>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
          Where Tradition<br />Meets Beauty
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          Discover ADYTRIX — premium artificial flowers, festive torans, decorative hangings, brass-finish bells and more, crafted to bring warmth and elegance to every corner of your home.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 bg-white px-7 text-base text-[#1b1613] hover:bg-[#f5e7c7]">
            <Link href="/shop">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 border-white/60 bg-black/10 px-7 text-base text-white hover:bg-white hover:text-[#1b1613]">
            <Link href="/categories">Explore Collection</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
          <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#f0d79a]" /> Free shipping over ₹999</span>
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#f0d79a]" /> Secure checkout</span>
          <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#f0d79a]" /> Handmade with care</span>
        </div>
      </HeroSlider>

      {/* FEATURED */}
      <section className="container py-16">
        <SectionHeading eyebrow="Handpicked for you" title="Featured Products" href="/shop" linkLabel="View all" />
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : <Empty message="Featured products are coming soon." />}
      </section>

      {/* CATEGORIES */}
      <section className="bg-[#faf4e9] py-16">
        <div className="container">
          <SectionHeading eyebrow="Find your style" title="Shop by Category" href="/categories" linkLabel="All categories" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.slice(0, 8).map((c) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className="group relative overflow-hidden rounded-xl border border-border bg-card aspect-[4/5]">
                <img src={c.image} alt={`${c.name} collection by ADYTRIX`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-4">
                  <h3 className="font-display text-lg text-white">{c.name}</h3>
                  <span className="text-xs text-white/80 group-hover:text-[#f0d79a] transition-colors">Shop now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING */}
      {trending.length > 0 && (
        <section className="container py-16">
          <SectionHeading eyebrow="Loved by customers" title="Trending Now" href="/trending" linkLabel="See trending" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trending.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ABOUT / BRAND */}
      <section className="bg-[#1b1613] text-[#e9ddc8]">
        <div className="container grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-16 lg:py-20">
          <img src={CRAFT1} alt="Handcrafted decorative pieces reflecting the ADYTRIX artisanal aesthetic" loading="lazy" className="w-full rounded-2xl object-cover aspect-[4/3] shadow-xl order-2 lg:order-1" />
          <div className="order-1 lg:order-2">
            <span className="text-xs tracking-[0.3em] uppercase text-[#B8862F]">The ADYTRIX Story</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-white">Crafted with heart, made to be loved</h2>
            <p className="mt-5 text-[#c9bca5] leading-relaxed">
              ADYTRIX began with a simple belief — that beautiful, meaningful decor should be within everyone's reach. Trusted by thousands of shoppers across Flipkart, Meesho and Shopsy, we now bring our full collection to one premium destination.
            </p>
            <p className="mt-4 text-[#c9bca5] leading-relaxed">
              Every toran, hanging and bell is thoughtfully crafted to add warmth, positivity and timeless charm to your home.
            </p>
            <Button asChild variant="outline" className="mt-7 border-[#B8862F] text-[#e9ddc8] hover:bg-[#B8862F] hover:text-white">
              <Link href="/about">Learn more about us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WHY ADYTRIX */}
      <section className="container py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-[#B8862F]">Why shop with us</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">The ADYTRIX promise</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Sparkles, title: 'Premium Craftsmanship', text: 'Carefully handcrafted pieces using quality, long-lasting materials.' },
            { icon: Truck, title: 'Fast & Free Shipping', text: 'Free delivery on orders over ₹999, shipped across India.' },
            { icon: ShieldCheck, title: 'Secure Shopping', text: 'Protected checkout and privacy-first order handling.' },
            { icon: Heart, title: 'Loved by Thousands', text: 'Trusted across Flipkart, Meesho and Shopsy marketplaces.' },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e4cc] text-[#8A6420]"><f.icon className="h-6 w-6" /></div>
              <h3 className="font-medium text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL */}
      <section className="bg-[#faf4e9] py-16">
        <div className="container text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-[#B8862F]">@ady_trix</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Follow our journey</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Join our community on Instagram and Facebook for new arrivals, festive inspiration and styling ideas.</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[TORAN1, GARLAND1, HANGING1, CRAFT1].map((src, i) => (
              <a key={i} href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border border-border aspect-square group">
                <img src={src} alt="ADYTRIX decor featured on Instagram" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({ eyebrow, title, href, linkLabel }) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        {eyebrow && <span className="text-xs tracking-[0.3em] uppercase text-[#B8862F]">{eyebrow}</span>}
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && <Link href={href} className="shrink-0 text-sm font-medium text-foreground/70 hover:text-[#B8862F] transition-colors whitespace-nowrap">{linkLabel} →</Link>}
    </div>
  )
}

function Empty({ message }) {
  return <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">{message}</div>
}
