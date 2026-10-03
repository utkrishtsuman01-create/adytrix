import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, Truck, ShieldCheck, Tag } from 'lucide-react'
import Breadcrumbs from '@/components/site/breadcrumbs'
import ProductGallery from '@/components/site/product-gallery'
import ProductActions from '@/components/site/product-actions'
import ProductCard from '@/components/site/product-card'
import { getProductBySlug, getRelatedProducts, getCategoryBySlug } from '@/lib/data'
import { getDb } from '@/lib/mongo'
import { inr, discountPct } from '@/lib/format'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://adytrix.com'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }
  const desc = (product.description || '').slice(0, 160)
  return {
    title: product.name,
    description: desc || `${product.name} by ADYTRIX.`,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${product.name} | ADYTRIX`,
      description: desc,
      type: 'website',
      images: product.images?.length ? [product.images[0]] : [],
    },
    twitter: { card: 'summary_large_image', title: product.name, description: desc, images: product.images?.slice(0, 1) },
  }
}

async function categoryForProduct(product) {
  if (!product.categoryId) return null
  const db = await getDb()
  const c = await db.collection('categories').findOne({ id: product.categoryId })
  if (!c) return null
  const { _id, ...rest } = c
  return rest
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()
  const [related, category] = await Promise.all([
    getRelatedProducts(product, 4),
    categoryForProduct(product),
  ])
  const pct = discountPct(product.mrp, product.discountedPrice)

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
    { label: product.name },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images || [],
    brand: { '@type': 'Brand', name: 'ADYTRIX' },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.discountedPrice,
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/products/${product.slug}`,
    },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  }

  return (
    <div className="container py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid lg:grid-cols-2 gap-8 lg:gap-14">
        <ProductGallery images={product.images || []} name={product.name} />

        <div>
          {category && <Link href={`/categories/${category.slug}`} className="text-xs uppercase tracking-wider text-[#B8862F] hover:underline">{category.name}</Link>}
          <h1 className="mt-2 font-display text-3xl sm:text-4xl leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-center gap-2">
            {product.featured && <span className="rounded-full bg-[#f0e4cc] px-3 py-1 text-xs font-medium text-[#8A6420]">Featured</span>}
            {product.trending && <span className="rounded-full bg-[#1f1a16] px-3 py-1 text-xs font-medium text-[#f4ead6]">Trending</span>}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold">{inr(product.discountedPrice)}</span>
            {product.mrp > product.discountedPrice && <span className="text-xl text-muted-foreground line-through">{inr(product.mrp)}</span>}
            {pct > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-sm font-medium text-green-800"><Tag className="h-3.5 w-3.5" />{pct}% OFF</span>}
          </div>

          <p className={`mt-3 text-sm font-medium ${product.available ? 'text-green-700' : 'text-destructive'}`}>
            {product.available ? '✓ In stock — ready to ship' : 'Currently unavailable'}
          </p>

          <div className="mt-7">
            <ProductActions product={product} />
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"><Truck className="h-4 w-4 text-[#B8862F]" /> Free shipping over ₹999</div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"><ShieldCheck className="h-4 w-4 text-[#B8862F]" /> Secure checkout</div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"><Check className="h-4 w-4 text-[#B8862F]" /> Handmade quality</div>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-display text-xl mb-3">Product Details</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl sm:text-3xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
