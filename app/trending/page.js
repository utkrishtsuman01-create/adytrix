import Breadcrumbs from '@/components/site/breadcrumbs'
import ProductCard from '@/components/site/product-card'
import { getTrendingProducts } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Trending Products',
  description: 'Discover the most-loved ADYTRIX products right now — trending torans, hangings, flowers and lifestyle picks chosen by our customers.',
  alternates: { canonical: '/trending' },
}

export default async function TrendingPage() {
  const products = await getTrendingProducts(60)
  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Trending' }]} />
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">Trending Now</h1>
      <p className="mt-2 text-muted-foreground">The pieces our customers are loving most this season.</p>
      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">No trending products right now. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
