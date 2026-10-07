const BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

let cachedToken = null
let tokenExpiresAt = 0

function config() {
  const email = String(process.env.SHIPROCKET_EMAIL || '').trim()
  const password = String(process.env.SHIPROCKET_PASSWORD || '')
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || '').trim()
  const originPincode = String(process.env.SHIPROCKET_ORIGIN_PINCODE || '').trim()
  if (!email || !password) {
    throw new Error('Shiprocket is not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel.')
  }
  return {
    email,
    password,
    pickupLocation,
    originPincode,
    defaults: {
      weightKg: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
      lengthCm: Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 20),
      widthCm: Number(process.env.SHIPROCKET_DEFAULT_WIDTH_CM || 15),
      heightCm: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 10),
    },
  }
}

function toPositiveNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function login(force = false) {
  const cfg = config()
  if (!force && cachedToken && tokenExpiresAt > Date.now() + 60_000) return cachedToken

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.token) {
    throw new Error(data.message || data.error || 'Shiprocket authentication failed.')
  }

  cachedToken = data.token
  // Shiprocket documents the token as valid for 240 hours. Refresh slightly early.
  tokenExpiresAt = Date.now() + (9 * 24 * 60 * 60 * 1000)
  return cachedToken
}

async function request(path, options = {}, retry = true) {
  const token = await login()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  })
  if (res.status === 401 && retry) {
    await login(true)
    return request(path, options, false)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.message || data.error || data.errors || `Shiprocket request failed (${res.status})`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return data
}

function packageValues(pkg = {}) {
  const cfg = config()
  return {
    weight: toPositiveNumber(pkg.weight, cfg.defaults.weightKg),
    length: toPositiveNumber(pkg.length, cfg.defaults.lengthCm),
    breadth: toPositiveNumber(pkg.width || pkg.breadth, cfg.defaults.widthCm),
    height: toPositiveNumber(pkg.height, cfg.defaults.heightCm),
  }
}

export function getShiprocketConfig() {
  const cfg = config()
  return {
    pickupLocation: cfg.pickupLocation,
    originPincode: cfg.originPincode,
    defaults: cfg.defaults,
  }
}

export async function getPickupAddresses() {
  return request('/settings/company/pickup', { method: 'GET' })
}

export async function getCourierOptions({ deliveryPincode, weight, cod = false, declaredValue = 0, package: pkg = {} }) {
  const cfg = config()
  const p = packageValues({ ...pkg, weight })
  if (!cfg.originPincode) throw new Error('SHIPROCKET_ORIGIN_PINCODE is not configured.')
  const query = new URLSearchParams({
    pickup_postcode: cfg.originPincode,
    delivery_postcode: String(deliveryPincode || ''),
    weight: String(p.weight),
    cod: cod ? '1' : '0',
    length: String(p.length),
    breadth: String(p.breadth),
    height: String(p.height),
    declared_value: String(Math.max(0, Number(declaredValue) || 0)),
  })
  return request(`/courier/serviceability/?${query.toString()}`, { method: 'GET' })
}

export async function createOrder(order, packageDetails = {}) {
  const cfg = config()
  if (!cfg.pickupLocation) throw new Error('SHIPROCKET_PICKUP_LOCATION is not configured.')
  const p = packageValues(packageDetails)
  const addr = order.deliveryAddress
  const lastName = String(addr.name || '').trim().split(/\s+/).slice(1).join(' ')
  const items = (order.items || []).map((item) => ({
    name: item.name,
    sku: item.productId,
    units: item.quantity,
    selling_price: Number(item.price),
    discount: 0,
    tax: 0,
    hsn: '',
  }))

  const payload = {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 19).replace('T', ' '),
    pickup_location: cfg.pickupLocation,
    channel_id: '',
    billing_customer_name: String(addr.name || '').trim(),
    billing_last_name: lastName,
    billing_address: String(addr.address || '').trim(),
    billing_address_2: '',
    billing_city: String(addr.city || '').trim(),
    billing_pincode: String(addr.postalCode || '').trim(),
    billing_state: String(addr.state || '').trim(),
    billing_country: String(addr.country || 'India').trim(),
    billing_email: String(addr.email || '').trim(),
    billing_phone: String(addr.phone || '').trim(),
    shipping_is_billing: true,
    shipping_customer_name: String(addr.name || '').trim(),
    shipping_last_name: lastName,
    shipping_address: String(addr.address || '').trim(),
    shipping_address_2: '',
    shipping_city: String(addr.city || '').trim(),
    shipping_pincode: String(addr.postalCode || '').trim(),
    shipping_country: String(addr.country || 'India').trim(),
    shipping_state: String(addr.state || '').trim(),
    shipping_email: String(addr.email || '').trim(),
    shipping_phone: String(addr.phone || '').trim(),
    order_items: items,
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    shipping_charges: Number(order.shipping || 0),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(order.discount || 0),
    sub_total: Number(order.subtotal || order.total || 0),
    length: p.length,
    breadth: p.breadth,
    height: p.height,
    weight: p.weight,
  }
  if (order.paymentMethod === 'cod') payload.cod_amount = Number(order.total || 0)

  return request('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function assignAwb(shipmentId, courierId) {
  return request('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: Number(shipmentId),
      courier_id: courierId ? Number(courierId) : undefined,
    }),
  })
}

export async function schedulePickup(shipmentId) {
  return request('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  })
}

export async function trackAwb(awb) {
  return request(`/courier/track/awb/${encodeURIComponent(awb)}`, { method: 'GET' })
}
