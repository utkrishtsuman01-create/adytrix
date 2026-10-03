import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { ensureSeed } from '@/lib/seed'
import {
  hashPassword, verifyPassword, signToken, getAuth, setAuthCookie, clearAuthCookie,
} from '@/lib/auth'
import { slugify } from '@/lib/format'
import { rateLimit } from '@/lib/ratelimit'

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}
function json(data, status = 200) { return cors(NextResponse.json(data, { status })) }
function err(message, status = 400) { return cors(NextResponse.json({ error: message }, { status })) }

export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })) }

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RX = /^[0-9]{10}$/
const sanitizeUser = (u) => { if (!u) return u; const { _id, passwordHash, ...rest } = u; return rest }

function clientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

// Allowed order status transitions (server-enforced)
const TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['shipped', 'rejected'],
  shipped: ['completed'],
  completed: [],
  rejected: [],
}

async function recomputeItems(db, rawItems) {
  // rawItems: [{productId, quantity}] -> server-priced snapshot
  const items = []
  let subtotal = 0
  let mrpTotal = 0
  for (const it of rawItems || []) {
    const qty = Math.max(1, Math.min(99, parseInt(it.quantity, 10) || 1))
    const p = await db.collection('products').findOne({ id: it.productId })
    if (!p || !p.available) return { error: `Product unavailable` }
    const price = Number(p.discountedPrice ?? p.mrp)
    const mrp = Number(p.mrp ?? price)
    subtotal += price * qty
    mrpTotal += mrp * qty
    items.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: (p.images && p.images[0]) || '',
      price,
      mrp,
      quantity: qty,
    })
  }
  if (items.length === 0) return { error: 'Cart is empty' }
  const discount = Math.max(0, mrpTotal - subtotal)
  const shipping = subtotal >= 999 ? 0 : 59
  const total = subtotal + shipping
  return { items, subtotal, discount, shipping, total }
}

async function audit(db, adminId, action, resourceType, resourceId, metadata = {}) {
  await db.collection('audit_logs').insertOne({
    id: uuidv4(), adminId, action, resourceType, resourceId, metadata, createdAt: new Date(),
  })
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    await ensureSeed()
    const db = await getDb()
    const auth = getAuth(request)
    const contentType = request.headers.get('content-type') || ''
    const body = (method !== 'GET' && method !== 'DELETE' && contentType.includes('application/json'))
      ? await request.json().catch(() => ({}))
      : {}
    const url = new URL(request.url)
    const qp = url.searchParams

    // ---------------- HEALTH ----------------
    if (route === '/' || route === '/root') return json({ message: 'ADYTRIX API' })

    // ---------------- AUTH ----------------
    if (route === '/auth/signup' && method === 'POST') {
      const rl = rateLimit(`signup:${clientIp(request)}`, 8, 60000)
      if (!rl.ok) return err('Too many attempts. Please try again later.', 429)
      const name = String(body.name || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      const phone = String(body.phone || '').trim()
      const password = String(body.password || '')
      if (!name || !EMAIL_RX.test(email) || !PHONE_RX.test(phone) || password.length < 6)
        return err('Please provide a valid name, email, 10-digit phone and a password of at least 6 characters.')
      if (await db.collection('users').findOne({ email })) return err('An account with this email already exists.', 409)
      if (await db.collection('users').findOne({ phone })) return err('An account with this phone already exists.', 409)
      const user = {
        id: uuidv4(), name, email, phone, passwordHash: hashPassword(password),
        role: 'customer', createdAt: new Date(), updatedAt: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken({ uid: user.id, role: user.role, name: user.name })
      return setAuthCookie(json({ user: sanitizeUser(user) }, 201), token)
    }

    if (route === '/auth/login' && method === 'POST') {
      const rl = rateLimit(`login:${clientIp(request)}`, 10, 60000)
      if (!rl.ok) return err('Too many attempts. Please try again later.', 429)
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const user = await db.collection('users').findOne({ email, role: 'customer' })
      if (!user || !verifyPassword(password, user.passwordHash)) return err('Invalid email or password.', 401)
      const token = signToken({ uid: user.id, role: user.role, name: user.name })
      return setAuthCookie(json({ user: sanitizeUser(user) }), token)
    }

    if (route === '/auth/admin-login' && method === 'POST') {
      const rl = rateLimit(`adminlogin:${clientIp(request)}`, 8, 60000)
      if (!rl.ok) return err('Too many attempts. Please try again later.', 429)
      const phone = String(body.phone || '').trim()
      const password = String(body.password || '')
      const user = await db.collection('users').findOne({ phone, role: 'admin' })
      if (!user || !verifyPassword(password, user.passwordHash)) return err('Invalid credentials.', 401)
      const token = signToken({ uid: user.id, role: 'admin', name: user.name })
      return setAuthCookie(json({ user: sanitizeUser(user) }), token)
    }

    if (route === '/auth/logout' && method === 'POST') {
      return clearAuthCookie(json({ ok: true }))
    }

    if (route === '/auth/me' && method === 'GET') {
      if (!auth) return json({ user: null })
      const user = await db.collection('users').findOne({ id: auth.uid })
      return json({ user: sanitizeUser(user) })
    }

    if (route === '/auth/profile' && method === 'PUT') {
      if (!auth) return err('Unauthorized', 401)
      const update = {}
      if (body.name) update.name = String(body.name).trim()
      if (body.phone) {
        const phone = String(body.phone).trim()
        if (!PHONE_RX.test(phone)) return err('Invalid phone number.')
        const existing = await db.collection('users').findOne({ phone, id: { $ne: auth.uid } })
        if (existing) return err('Phone already in use.', 409)
        update.phone = phone
      }
      update.updatedAt = new Date()
      await db.collection('users').updateOne({ id: auth.uid }, { $set: update })
      const user = await db.collection('users').findOne({ id: auth.uid })
      return json({ user: sanitizeUser(user) })
    }

    if (route === '/auth/change-password' && method === 'POST') {
      if (!auth) return err('Unauthorized', 401)
      const current = String(body.currentPassword || '')
      const next = String(body.newPassword || '')
      if (next.length < 6) return err('New password must be at least 6 characters.')
      const user = await db.collection('users').findOne({ id: auth.uid })
      if (!user || !verifyPassword(current, user.passwordHash)) return err('Current password is incorrect.', 401)
      await db.collection('users').updateOne({ id: auth.uid }, { $set: { passwordHash: hashPassword(next), updatedAt: new Date() } })
      return json({ ok: true })
    }

    // ---------------- PUBLIC CATALOG ----------------
    if (route === '/categories' && method === 'GET') {
      const cats = await db.collection('categories').find({ active: true }).sort({ name: 1 }).toArray()
      return json({ categories: cats.map((c) => { const { _id, ...r } = c; return r }) })
    }

    if (route === '/products' && method === 'GET') {
      const q = { available: true }
      const category = qp.get('category')
      const search = qp.get('search')
      const sort = qp.get('sort')
      if (category) q.categoryId = category
      if (qp.get('featured') === 'true') q.featured = true
      if (qp.get('trending') === 'true') q.trending = true
      if (search) {
        const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        q.$or = [{ name: rx }, { description: rx }, { categoryName: rx }]
      }
      let cursor = db.collection('products').find(q)
      if (sort === 'price_asc') cursor = cursor.sort({ discountedPrice: 1 })
      else if (sort === 'price_desc') cursor = cursor.sort({ discountedPrice: -1 })
      else cursor = cursor.sort({ createdAt: -1 })
      const docs = await cursor.limit(100).toArray()
      return json({ products: docs.map((d) => { const { _id, ...r } = d; return r }) })
    }

    if (route.startsWith('/products/') && method === 'GET') {
      const slug = path[1]
      const p = await db.collection('products').findOne({ slug })
      if (!p) return err('Product not found', 404)
      const { _id, ...rest } = p
      return json({ product: rest })
    }

    // ---------------- IMAGES (cloud-style storage in DB, served with cache) ----------------
    if (route.startsWith('/images/') && method === 'GET') {
      const id = path[1]
      const img = await db.collection('images').findOne({ id })
      if (!img) return err('Image not found', 404)
      const buf = Buffer.from(img.data.buffer || img.data)
      const res = new NextResponse(buf, { status: 200 })
      res.headers.set('Content-Type', img.contentType || 'image/jpeg')
      res.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return res
    }

    // ---------------- CART VALIDATION ----------------
    if (route === '/cart/validate' && method === 'POST') {
      const result = await recomputeItems(db, body.items)
      if (result.error) return err(result.error)
      return json(result)
    }

    // ---------------- ORDERS (customer) ----------------
    if (route === '/orders' && method === 'POST') {
      if (!auth) return err('Please sign in to place an order.', 401)
      const addr = body.deliveryAddress || {}
      const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'postalCode']
      for (const f of required) if (!String(addr[f] || '').trim()) return err(`Missing delivery field: ${f}`)
      const method_ = body.paymentMethod === 'cod' ? 'cod' : 'razorpay_link'
      const priced = await recomputeItems(db, body.items)
      if (priced.error) return err(priced.error)
      const now = new Date()
      const order = {
        id: uuidv4(),
        orderNumber: 'ADX' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10),
        userId: auth.uid,
        items: priced.items,
        subtotal: priced.subtotal,
        discount: priced.discount,
        shipping: priced.shipping,
        total: priced.total,
        paymentStatus: 'pending',
        paymentMethod: method_,
        paymentReference: null,
        orderStatus: 'pending',
        deliveryAddress: {
          name: String(addr.name).trim(), phone: String(addr.phone).trim(), email: String(addr.email).trim(),
          address: String(addr.address).trim(), city: String(addr.city).trim(), state: String(addr.state).trim(),
          postalCode: String(addr.postalCode).trim(), country: String(addr.country || 'India').trim(),
        },
        createdAt: now, updatedAt: now,
      }
      await db.collection('orders').insertOne(order)
      await db.collection('order_status_history').insertOne({ id: uuidv4(), orderId: order.id, status: 'pending', changedBy: auth.uid, timestamp: now })
      const { _id, ...rest } = order
      return json({ order: rest }, 201)
    }

    if (route === '/orders' && method === 'GET') {
      if (!auth) return err('Unauthorized', 401)
      const docs = await db.collection('orders').find({ userId: auth.uid }).sort({ createdAt: -1 }).toArray()
      return json({ orders: docs.map((d) => { const { _id, ...r } = d; return r }) })
    }

    if (route.startsWith('/orders/') && method === 'GET') {
      if (!auth) return err('Unauthorized', 401)
      const id = path[1]
      const order = await db.collection('orders').findOne({ id })
      if (!order) return err('Order not found', 404)
      if (order.userId !== auth.uid && auth.role !== 'admin') return err('Forbidden', 403)
      const history = await db.collection('order_status_history').find({ orderId: id }).sort({ timestamp: 1 }).toArray()
      const { _id, ...rest } = order
      return json({ order: rest, history: history.map((h) => { const { _id, ...r } = h; return r }) })
    }

    // ================= ADMIN =================
    const requireAdmin = () => auth && auth.role === 'admin'

    if (route === '/admin/stats' && method === 'GET') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const [orders, products, customers] = await Promise.all([
        db.collection('orders').find({}).toArray(),
        db.collection('products').countDocuments(),
        db.collection('users').countDocuments({ role: 'customer' }),
      ])
      const byStatus = (s) => orders.filter((o) => o.orderStatus === s).length
      const revenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((a, o) => a + (o.total || 0), 0)
      const recent = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
        .map((o) => ({ id: o.id, orderNumber: o.orderNumber, total: o.total, orderStatus: o.orderStatus, paymentStatus: o.paymentStatus, customer: o.deliveryAddress?.name, createdAt: o.createdAt }))
      return json({
        stats: {
          totalOrders: orders.length, pending: byStatus('pending'), accepted: byStatus('accepted'),
          shipped: byStatus('shipped'), completed: byStatus('completed'), rejected: byStatus('rejected'),
          totalProducts: products, totalCustomers: customers, revenue,
        },
        recentOrders: recent,
      })
    }

    if (route === '/admin/orders' && method === 'GET') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const docs = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray()
      return json({ orders: docs.map((d) => { const { _id, ...r } = d; return r }) })
    }

    if (route.match(/^\/admin\/orders\/[^/]+\/status$/) && method === 'PATCH') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      const next = String(body.status || '')
      const order = await db.collection('orders').findOne({ id })
      if (!order) return err('Order not found', 404)
      const allowed = TRANSITIONS[order.orderStatus] || []
      if (!allowed.includes(next)) return err(`Cannot change status from ${order.orderStatus} to ${next}.`)
      const now = new Date()
      await db.collection('orders').updateOne({ id }, { $set: { orderStatus: next, updatedAt: now } })
      await db.collection('order_status_history').insertOne({ id: uuidv4(), orderId: id, status: next, changedBy: auth.uid, timestamp: now })
      await audit(db, auth.uid, `order_${next}`, 'order', id, { from: order.orderStatus })
      return json({ ok: true, status: next })
    }

    if (route.match(/^\/admin\/orders\/[^/]+\/payment$/) && method === 'PATCH') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      const status = ['paid', 'pending', 'failed'].includes(body.paymentStatus) ? body.paymentStatus : null
      if (!status) return err('Invalid payment status.')
      const order = await db.collection('orders').findOne({ id })
      if (!order) return err('Order not found', 404)
      await db.collection('orders').updateOne({ id }, { $set: { paymentStatus: status, paymentReference: body.reference || order.paymentReference || null, updatedAt: new Date() } })
      await audit(db, auth.uid, `payment_${status}`, 'order', id, {})
      return json({ ok: true })
    }

    if (route === '/admin/products' && method === 'GET') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const docs = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray()
      return json({ products: docs.map((d) => { const { _id, ...r } = d; return r }) })
    }

    if (route === '/admin/products' && method === 'POST') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const p = validateProduct(body)
      if (p.error) return err(p.error)
      const cat = await db.collection('categories').findOne({ id: p.data.categoryId })
      const now = new Date()
      const doc = {
        id: uuidv4(), ...p.data, categoryName: cat?.name || '', slug: slugify(p.data.name) + '-' + Date.now().toString().slice(-4),
        createdAt: now, updatedAt: now,
      }
      await db.collection('products').insertOne(doc)
      await audit(db, auth.uid, 'product_create', 'product', doc.id, { name: doc.name })
      const { _id, ...rest } = doc
      return json({ product: rest }, 201)
    }

    if (route.match(/^\/admin\/products\/[^/]+$/) && method === 'GET') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      const p = await db.collection('products').findOne({ id })
      if (!p) return err('Not found', 404)
      const { _id, ...rest } = p
      return json({ product: rest })
    }

    if (route.match(/^\/admin\/products\/[^/]+$/) && method === 'PUT') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      const p = validateProduct(body)
      if (p.error) return err(p.error)
      const cat = await db.collection('categories').findOne({ id: p.data.categoryId })
      await db.collection('products').updateOne({ id }, { $set: { ...p.data, categoryName: cat?.name || '', updatedAt: new Date() } })
      await audit(db, auth.uid, 'product_update', 'product', id, {})
      const updated = await db.collection('products').findOne({ id })
      const { _id, ...rest } = updated
      return json({ product: rest })
    }

    if (route.match(/^\/admin\/products\/[^/]+$/) && method === 'DELETE') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      await db.collection('products').deleteOne({ id })
      await audit(db, auth.uid, 'product_delete', 'product', id, {})
      return json({ ok: true })
    }

    if (route === '/admin/upload' && method === 'POST') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const form = await request.formData().catch(() => null)
      if (!form) return err('Invalid upload')
      const files = form.getAll('images').filter((f) => typeof f === 'object' && f.arrayBuffer)
      if (!files.length) return err('No images provided')
      if (files.length > 5) return err('Maximum 5 images allowed', 422)
      const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
      const MAX = 5 * 1024 * 1024
      const urls = []
      for (const file of files) {
        const type = (file.type || '').toLowerCase()
        if (!ALLOWED[type]) return err(`Unsupported image type: ${type}`, 422)
        if (!file.size || file.size > MAX) return err('Each image must be at most 5 MB', 422)
        const buf = Buffer.from(await file.arrayBuffer())
        if (!magicOk(buf, type)) return err('File content does not match image type', 422)
        const id = uuidv4()
        await db.collection('images').insertOne({ id, data: buf, contentType: type, size: file.size, createdAt: new Date() })
        urls.push(`/api/images/${id}`)
      }
      return json({ urls }, 201)
    }

    // ---- Admin categories ----
    if (route === '/admin/categories' && method === 'GET') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const docs = await db.collection('categories').find({}).sort({ name: 1 }).toArray()
      return json({ categories: docs.map((d) => { const { _id, ...r } = d; return r }) })
    }
    if (route === '/admin/categories' && method === 'POST') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const name = String(body.name || '').trim()
      if (!name) return err('Category name is required')
      const slug = slugify(name)
      if (await db.collection('categories').findOne({ slug })) return err('Category already exists', 409)
      const now = new Date()
      const doc = { id: uuidv4(), name, slug, description: String(body.description || '').trim(), image: String(body.image || ''), active: body.active !== false, createdAt: now, updatedAt: now }
      await db.collection('categories').insertOne(doc)
      await audit(db, auth.uid, 'category_create', 'category', doc.id, { name })
      const { _id, ...rest } = doc
      return json({ category: rest }, 201)
    }
    if (route.match(/^\/admin\/categories\/[^/]+$/) && method === 'PUT') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      const update = { updatedAt: new Date() }
      if (body.name !== undefined) { update.name = String(body.name).trim(); update.slug = slugify(update.name) }
      if (body.description !== undefined) update.description = String(body.description).trim()
      if (body.image !== undefined) update.image = String(body.image)
      if (body.active !== undefined) update.active = !!body.active
      await db.collection('categories').updateOne({ id }, { $set: update })
      await audit(db, auth.uid, 'category_update', 'category', id, {})
      const updated = await db.collection('categories').findOne({ id })
      const { _id, ...rest } = updated
      return json({ category: rest })
    }
    if (route.match(/^\/admin\/categories\/[^/]+$/) && method === 'DELETE') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const id = path[2]
      await db.collection('categories').deleteOne({ id })
      await audit(db, auth.uid, 'category_delete', 'category', id, {})
      return json({ ok: true })
    }

    // ---- Admin customers ----
    if (route === '/admin/customers' && method === 'GET') {
      if (!requireAdmin()) return err('Forbidden', 403)
      const users = await db.collection('users').find({ role: 'customer' }).sort({ createdAt: -1 }).toArray()
      const out = []
      for (const u of users) {
        const orderCount = await db.collection('orders').countDocuments({ userId: u.id })
        out.push({ id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt, orderCount })
      }
      return json({ customers: out })
    }

    return err(`Route ${route} not found`, 404)
  } catch (e) {
    console.error('API Error:', e?.message)
    return err('Internal server error', 500)
  }
}

function validateProduct(body) {
  const name = String(body.name || '').trim()
  const categoryId = String(body.categoryId || '').trim()
  const mrp = Number(body.mrp)
  const discountedPrice = Number(body.discountedPrice)
  const rawImages = Array.isArray(body.images) ? body.images.filter(Boolean) : []
  if (!name) return { error: 'Product name is required' }
  if (!categoryId) return { error: 'Category is required' }
  if (!(mrp > 0)) return { error: 'MRP must be greater than 0' }
  if (!(discountedPrice > 0) || discountedPrice > mrp) return { error: 'Discounted price must be > 0 and <= MRP' }
  if (rawImages.length > 5) return { error: 'Maximum 5 images allowed' }
  const images = rawImages
  return {
    data: {
      name, categoryId, mrp, discountedPrice, images,
      description: String(body.description || '').trim(),
      featured: !!body.featured, trending: !!body.trending,
      available: body.available !== false, stock: Number(body.stock) || 0,
    },
  }
}

function magicOk(buf, type) {
  if (buf.length < 12) return false
  if (type === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (type === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  if (type === 'image/gif') return buf.slice(0, 3).toString('ascii') === 'GIF'
  if (type === 'image/webp') return buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP'
  return false
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
