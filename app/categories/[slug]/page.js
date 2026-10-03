import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/site/breadcrumbs'
import ProductCard from '@/components/site/product-card'
import { getCategoryBySlug, listProducts } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Category Not Found' }
  return {
    title: category.name,
    description: `Shop ${category.name} at ADYTRIX. ${category.description || ''}`.trim(),
    alternates: { canonical: `/categories/${slug}` },
    openGraph: { title: `${category.name} | ADYTRIX`, description: category.description, images: category.image ? [category.image] : [] },
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category || !category.active) notFound()
  const products = await listProducts({ category: category.id })

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Categories', href: '/categories' }, { label: category.name }]} />
      <div className="mt-4 mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">{category.name}</h1>
        {category.description && <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>}
      </div>
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">No products in this category yet.</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
