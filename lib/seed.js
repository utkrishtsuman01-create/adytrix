import { getDb } from './mongo'
import { hashPassword } from './auth'
import { slugify } from './format'
import { v4 as uuidv4 } from 'uuid'
import { TORAN1, HANGING1, GARLAND1, HANGING2, BAG1, BAG2, SHIRT1, SHIRT2, DECOR1 } from './assets'

let seedPromise = null

// Single shared promise so concurrent requests never double-seed / race.
export function ensureSeed() {
  if (!seedPromise) seedPromise = doSeed().catch((e) => { seedPromise = null; throw e })
  return seedPromise
}

async function doSeed() {
  const db = await getDb()

  // Indexes for data integrity & duplicate-payment protection
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true })
    await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true })
    await db.collection('orders').createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true })
    await db.collection('orders').createIndex({ razorpayPaymentId: 1 }, { unique: true, sparse: true })
  } catch (e) { /* index creation is best-effort */ }

  // ---- Admin bootstrap (from env, never hardcoded) ----
  const adminPhone = process.env.ADMIN_PHONE
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPhone && adminPassword) {
    const existing = await db.collection('users').findOne({ phone: adminPhone, role: 'admin' })
    if (!existing) {
      await db.collection('users').insertOne({
        id: uuidv4(),
        name: process.env.ADMIN_NAME || 'ADYTRIX Admin',
        email: 'admin@adytrix.local',
        phone: adminPhone,
        passwordHash: hashPassword(adminPassword),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // ---- Categories (upsert by slug, then load reliably) ----
  const catDefs = [
    { name: 'Artificial Flowers', image: GARLAND1, description: 'Lifelike fabric flowers and garlands that never wilt.' },
    { name: 'Festive Toran', image: TORAN1, description: 'Auspicious door torans to welcome prosperity.' },
    { name: 'Decorative Hangings', image: HANGING1, description: 'Elegant wall and door hangings with brass bells.' },
    { name: 'Decorative Bells', image: GARLAND1, description: 'Traditional brass-finish bells for home and temple.' },
    { name: "Women's Handbags", image: BAG1, description: 'Premium handbags crafted for everyday elegance.' },
    { name: "Men's Shirts", image: SHIRT1, description: 'Refined shirts for the modern wardrobe.' },
    { name: 'Other Products', image: DECOR1, description: 'Curated lifestyle and decorative finds.' },
  ]
  for (const c of catDefs) {
    const slug = slugify(c.name)
    await db.collection('categories').updateOne(
      { slug },
      {
        $setOnInsert: {
          id: uuidv4(), name: c.name, slug, description: c.description, image: c.image,
          active: true, createdAt: new Date(), updatedAt: new Date(),
        },
      },
      { upsert: true },
    )
  }
  const cats = await db.collection('categories').find({}).toArray()
  const catMap = {}
  cats.forEach((c) => { catMap[c.name] = c.id })

  // ---- Products ----
  const prodCount = await db.collection('products').countDocuments()
  if (prodCount === 0) {
    const P = [
      { name: 'Traditional Red & White Floral Toran with Golden Bells', cat: 'Festive Toran', images: [TORAN1, GARLAND1], mrp: 999, price: 499, featured: true, trending: true,
        description: 'Welcome positivity into your home with this handcrafted ADYTRIX toran featuring premium red and white fabric flowers finished with elegant golden bells. Approx. 3.5 ft top length with 2.5–3 ft side drops. Lightweight, reusable and perfect for Diwali, Ganesh Chaturthi, housewarmings and daily temple decor.' },
      { name: 'White & Red Fabric Flower Garland with Brass Bell', cat: 'Artificial Flowers', images: [GARLAND1, TORAN1], mrp: 699, price: 349, featured: true, trending: false,
        description: 'A neat, full-bodied garland of soft fabric flowers in classic red and white, finished with a decorative golden bell. Ideal for doorways, pooja rooms and festive backdrops. Reusable and easy to hang.' },
      { name: 'Lotus Flower Wall Hanging with Butterfly & Brass Bell (Set of 6)', cat: 'Decorative Hangings', images: [HANGING1, HANGING2], mrp: 1299, price: 649, featured: true, trending: true,
        description: 'Set of six graceful lotus-flower hangings with premium butterfly motifs, golden beads and gold-finish bells. Brings a serene, temple-like ambience to pooja spaces, entryways and festive walls. Handcrafted with care using eco-friendly materials.' },
      { name: '15-inch Lotus Hanging with Golden Bell (Yellow & White)', cat: 'Decorative Hangings', images: [HANGING2, HANGING1], mrp: 599, price: 299, featured: false, trending: true,
        description: 'A single 15-inch lotus hanging combining elegant white and vibrant yellow lotus flowers, a butterfly accent and a beautiful gold-finish bell. Handmade, durable and perfect for home, office and gifting.' },
      { name: 'Decorative Brass-Finish Temple Bell', cat: 'Decorative Bells', images: [GARLAND1], mrp: 499, price: 249, featured: true, trending: false,
        description: 'A finely detailed brass-finish bell with a warm golden sheen and gentle, resonant tone. A timeless addition to your pooja room, main door or festive hangings.' },
      { name: 'ADYTRIX Premium Women’s Handbag', cat: "Women's Handbags", images: [BAG1, BAG2], mrp: 2499, price: 1299, featured: true, trending: true,
        description: 'A structured premium handbag in rich leather-look finish with spacious compartments and refined hardware. Designed to elevate both everyday and occasion styling.' },
      { name: 'Classic Brown Sling Bag', cat: "Women's Handbags", images: [BAG2, BAG1], mrp: 1999, price: 999, featured: false, trending: false,
        description: 'A versatile brown sling bag with an adjustable strap and smart organisation — light, durable and effortlessly chic.' },
      { name: "Men's Premium Formal Shirt", cat: "Men's Shirts", images: [SHIRT1, SHIRT2], mrp: 1499, price: 799, featured: true, trending: false,
        description: 'A tailored premium shirt in breathable fabric with a crisp finish and comfortable regular fit. A wardrobe essential for work and occasions.' },
      { name: "Men's Casual Striped Shirt", cat: "Men's Shirts", images: [SHIRT2, SHIRT1], mrp: 1299, price: 699, featured: false, trending: true,
        description: 'A smart-casual striped shirt in soft, easy-care fabric — relaxed, breathable and perfect for everyday wear.' },
    ]
    const docs = P.map((p) => ({
      id: uuidv4(),
      name: p.name,
      slug: slugify(p.name),
      categoryId: catMap[p.cat] || null,
      categoryName: p.cat,
      description: p.description,
      mrp: p.mrp,
      discountedPrice: p.price,
      images: p.images,
      featured: p.featured,
      trending: p.trending,
      available: true,
      stock: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    await db.collection('products').insertMany(docs)
  }
}
