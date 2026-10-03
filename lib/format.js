export function inr(amount) {
  const n = Number(amount || 0)
  return '₹' + n.toLocaleString('en-IN')
}

export function discountPct(mrp, price) {
  const m = Number(mrp || 0)
  const p = Number(price || 0)
  if (!m || p >= m) return 0
  return Math.round(((m - p) / m) * 100)
}

export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
