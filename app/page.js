import Link from 'next/link'
import { ArrowRight, Heart, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductCard from '@/components/site/product-card'
import HeroSlider from '@/components/site/hero-slider'
import { getFeaturedProducts, getTrendingProducts, getActiveCategories } from '@/lib/data'
import { getSiteConfig } from '@/lib/site-config'
import { CRAFT1 } from '@/lib/assets'
import { SOCIAL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [featured, trending, categories, site] = await Promise.all([
    getFeaturedProducts(8),
    getTrendingProducts(8),
    getActiveCategories(),
    getSiteConfig(),
  ])

  const sections = Array.isArray(site.sections) ? site.sections.filter((s) => s.enabled !== false) : []

  return (
    <div>
      {site.hero?.enabled !== false && <HeroSlider slides={site.hero?.slides || []} />}

      {sections.map((section) => (
        <HomeSection key={section.id} section={section} featured={featured} trending={trending} categories={categories} />
      ))}

      <ContactStrip phone={site.footer?.phone} email={site.footer?.email} />
    </div>
  )
}

function HomeSection({ section, featured, trending, categories }) {
  switch (section.type) {
    case 'featured':
      return (
        <section className="container py-16">
          <SectionHeading eyebrow={section.eyebrow} title={section.title || 'Featured Products'} href={section.href || '/shop'} linkLabel="View all" />
          {featured.length ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : <Empty message="Featured products are coming soon." />}
        </section>
      )

    case 'categories':
      return (
        <section className="bg-[#eaf3f7] py-16">
          <div className="container">
            <SectionHeading eyebrow={section.eyebrow} title={section.title || 'Shop by Category'} href={section.href || '/categories'} linkLabel="All categories" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-card">
                  {c.image && <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 p-4">
                    <h3 className="font-display text-lg text-white">{c.name}</h3>
                    <span className="text-xs text-white/80 group-hover:text-[#f0d79a]">Shop now →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )

    case 'trending':
      return trending.length ? (
        <section className="container py-16">
          <SectionHeading eyebrow={section.eyebrow} title={section.title || 'Trending Now'} href={section.href || '/trending'} linkLabel="See trending" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {trending.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ) : null

    case 'story':
      return (
        <ContentImageSection
          dark
          eyebrow={section.eyebrow || 'The ADYTRIX Story'}
          title={section.title || 'Crafted with heart, made to be loved'}
          text={section.text}
          text2={section.text2}
          image={section.image || CRAFT1}
          buttonText={section.buttonText}
          buttonHref={section.buttonHref || '/about'}
        />
      )

    case 'promises':
      return (
        <section className="container py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-[#5f8aa1]">{section.eyebrow || 'Why shop with us'}</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">{section.title || 'The ADYTRIX promise'}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(section.items || []).map((item, index) => {
              const icons = [Sparkles, Truck, ShieldCheck, Heart]
              const Icon = icons[index % icons.length]
              return (
                <div key={index} className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d9eaf2] text-[#446c82]"><Icon className="h-6 w-6" /></div>
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>
      )

    case 'social':
      return (
        <section className="bg-[#eaf3f7] py-16">
          <div className="container text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-[#5f8aa1]">{section.eyebrow || '@ady_trix'}</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">{section.title || 'Follow our journey'}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{section.text || 'Join our community on Instagram and Facebook.'}</p>
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
              {categories.slice(0, 4).map((c) => c.image ? (
                <a key={c.id} href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="group aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </a>
              ) : null)}
            </div>
          </div>
        </section>
      )

    case 'custom':
      return (
        <ContentImageSection
          eyebrow={section.eyebrow}
          title={section.title || 'Custom section'}
          text={section.text}
          text2={section.text2}
          image={section.image}
          imagePosition={section.imagePosition || 'right'}
          buttonText={section.buttonText}
          buttonHref={section.buttonHref || '/'}
        />
      )

    default:
      return null
  }
}

function ContentImageSection({ dark = false, eyebrow, title, text, text2, image, imagePosition = 'right', buttonText, buttonHref }) {
  const imageFirst = imagePosition === 'left'
  const shell = dark ? 'bg-[#11181f] text-[#e4f0f5]' : 'bg-background'
  return (
    <section className={`${shell} py-16 lg:py-20`}>
      <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {image && imageFirst && <img src={image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />}
        <div className={imageFirst ? '' : 'lg:order-2'}>
          {eyebrow && <span className="text-xs uppercase tracking-[0.3em] text-[#5f8aa1]">{eyebrow}</span>}
          <h2 className={`mt-3 font-display text-3xl sm:text-4xl ${dark ? 'text-white' : ''}`}>{title}</h2>
          {text && <p className={`mt-5 leading-relaxed ${dark ? 'text-[#b7cad4]' : 'text-muted-foreground'}`}>{text}</p>}
          {text2 && <p className={`mt-4 leading-relaxed ${dark ? 'text-[#b7cad4]' : 'text-muted-foreground'}`}>{text2}</p>}
          {buttonText && (
            <Button asChild variant={dark ? 'outline' : 'default'} className={dark ? 'mt-7 border-[#5f8aa1] text-[#e4f0f5] hover:bg-[#5f8aa1] hover:text-white' : 'mt-7'}>
              <Link href={buttonHref || '/'}>{buttonText}<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          )}
        </div>
        {image && !imageFirst && <img src={image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl lg:order-1" />}
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, href, linkLabel }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <span className="text-xs uppercase tracking-[0.3em] text-[#5f8aa1]">{eyebrow}</span>}
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && <Link href={href} className="shrink-0 whitespace-nowrap text-sm font-medium text-foreground/70 hover:text-[#5f8aa1]">{linkLabel} →</Link>}
    </div>
  )
}

function Empty({ message }) {
  return <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">{message}</div>
}


function ContactStrip({ phone, email }) {
  const hasPhone = Boolean(phone)
  const hasEmail = Boolean(email)
  if (!hasPhone && !hasEmail) return null

  return (
    <section className="border-t border-border bg-[#eaf3f7] py-12">
      <div className="container">
        <div className="rounded-2xl border border-[#eadfc9] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-[#5f8aa1]">Need help?</span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl">Talk to ADYTRIX</h2>
              <p className="mt-2 text-sm text-muted-foreground">For product questions, orders and support, contact us directly.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasPhone && (
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="inline-flex h-11 items-center justify-center rounded-lg bg-[#11181f] px-5 text-sm font-medium text-white transition hover:bg-[#5f8aa1]">
                  Call {phone}
                </a>
              )}
              {hasEmail && (
                <a href={`mailto:${email}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-[#11181f] px-5 text-sm font-medium text-[#11181f] transition hover:bg-[#11181f] hover:text-white">
                  Email {email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
