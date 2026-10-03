import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import { getActiveCategories } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop by Category',
  description: 'Browse ADYTRIX categories — Artificial Flowers, Festive Toran, Decorative Hangings, Decorative Bells, Women’s Handbags, Men’s Shirts and more.',
  alternates: { canonical: '/categories' },
}

export default async function CategoriesPage() {
  const categories = await getActiveCategories()
  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]} />
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">Shop by Category</h1>
      <p className="mt-2 text-muted-foreground">Find exactly what you’re looking for across our curated collections.</p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((c) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="group relative overflow-hidden rounded-xl border border-border aspect-[4/3]">
            <img src={c.image} alt={`${c.name} collection by ADYTRIX`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <h2 className="font-display text-xl sm:text-2xl text-white">{c.name}</h2>
              <p className="mt-1 text-sm text-white/80 line-clamp-1">{c.description}</p>
              <span className="mt-2 inline-block text-sm text-[#f0d79a] group-hover:underline">Shop now →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
