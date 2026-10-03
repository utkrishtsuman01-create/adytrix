import crypto from 'crypto'

export const COOKIE = 'adytrix_session'
const SECRET = process.env.JWT_SECRET || 'adytrix-dev-secret'
const WEEK = 60 * 60 * 24 * 7

// ---------- Password hashing (scrypt) ----------
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  const test = crypto.scryptSync(String(password), salt, 64).toString('hex')
  const a = Buffer.from(test, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ---------- JWT (HS256) ----------
function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

export function signToken(payload, expiresInSec = WEEK) {
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + expiresInSec }
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const data = `${header}.${b64url(JSON.stringify(body))}`
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyToken(token) {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const data = `${parts[0]}.${parts[1]}`
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
    const a = Buffer.from(parts[2])
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ---------- Request helpers ----------
export function getAuth(request) {
  const token = request.cookies?.get?.(COOKIE)?.value
  return verifyToken(token)
}

export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: WEEK,
  })
  return response
}

export function clearAuthCookie(response) {
  response.cookies.set(COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
