import { getDb } from './mongo'
import { ensureSeed } from './seed'

function clean(doc) {
  if (!doc) return doc
  const { _id, passwordHash, ...rest } = doc
  return rest
}

export async function getActiveCategories() {
  await ensureSeed()
  const db = await getDb()
  const cats = await db.collection('categories').find({ active: true }).sort({ name: 1 }).toArray()
  return cats.map(clean)
}

export async function getCategoryBySlug(slug) {
  await ensureSeed()
  const db = await getDb()
  const c = await db.collection('categories').findOne({ slug })
  return clean(c)
}

export async function listProducts({ search, category, sort, featured, trending, limit = 60, skip = 0 } = {}) {
  await ensureSeed()
  const db = await getDb()
  const q = { available: true }
  if (category) q.categoryId = category
  if (featured) q.featured = true
  if (trending) q.trending = true
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    q.$or = [{ name: rx }, { description: rx }, { categoryName: rx }]
  }
  let cursor = db.collection('products').find(q)
  if (sort === 'price_asc') cursor = cursor.sort({ discountedPrice: 1 })
  else if (sort === 'price_desc') cursor = cursor.sort({ discountedPrice: -1 })
  else cursor = cursor.sort({ createdAt: -1 })
  const docs = await cursor.skip(Number(skip) || 0).limit(Number(limit) || 60).toArray()
  return docs.map(clean)
}

export async function getProductBySlug(slug) {
  await ensureSeed()
  const db = await getDb()
  const p = await db.collection('products').findOne({ slug })
  return clean(p)
}

export async function getFeaturedProducts(limit = 8) {
  return listProducts({ featured: true, limit })
}

export async function getTrendingProducts(limit = 12) {
  return listProducts({ trending: true, limit })
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product) return []
  await ensureSeed()
  const db = await getDb()
  const docs = await db.collection('products')
    .find({ available: true, categoryId: product.categoryId, slug: { $ne: product.slug } })
    .limit(limit).toArray()
  return docs.map(clean)
}

export async function getAllProductSlugs() {
  await ensureSeed()
  const db = await getDb()
  const docs = await db.collection('products').find({ available: true }, { projection: { slug: 1, updatedAt: 1 } }).toArray()
  return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }))
}
