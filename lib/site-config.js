import { getDb } from './mongo'
import { v4 as uuidv4 } from 'uuid'

export const DEFAULT_SITE_CONFIG = {
  key: 'main',
  announcement: {
    enabled: true,
    text: 'Handcrafted with love · Free shipping on orders over ₹999',
  },
  header: {
    logoUrl: '/adytrix-logo.jpg',
    navItems: [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/shop' },
      { label: 'Categories', href: '/categories' },
      { label: 'Trending', href: '/trending' },
      { label: 'About', href: '/about' },
    ],
  },
  hero: {
    enabled: true,
    overlay: true,
    slides: [],
  },
  sections: [
    { id: uuidv4(), type: 'featured', enabled: true, title: 'Featured Products', eyebrow: 'Handpicked for you' },
    { id: uuidv4(), type: 'categories', enabled: true, title: 'Shop by Category', eyebrow: 'Find your style' },
    { id: uuidv4(), type: 'trending', enabled: true, title: 'Trending Now', eyebrow: 'Loved by customers' },
    {
      id: uuidv4(),
      type: 'story',
      enabled: true,
      title: 'Crafted with heart, made to be loved',
      eyebrow: 'The ADYTRIX Story',
      text: "ADYTRIX began with a simple belief — that beautiful, meaningful decor should be within everyone's reach.",
      text2: 'Every toran, hanging and bell is thoughtfully crafted to add warmth, positivity and timeless charm to your home.',
      image: '',
      buttonText: 'Learn more about us',
      buttonHref: '/about',
    },
    {
      id: uuidv4(),
      type: 'promises',
      enabled: true,
      title: 'The ADYTRIX promise',
      eyebrow: 'Why shop with us',
      items: [
        { title: 'Premium Craftsmanship', text: 'Carefully handcrafted pieces using quality, long-lasting materials.' },
        { title: 'Fast & Free Shipping', text: 'Free delivery on orders over ₹999, shipped across India.' },
        { title: 'Secure Shopping', text: 'Protected checkout and privacy-first order handling.' },
        { title: 'Loved by Thousands', text: 'Trusted across Flipkart, Meesho and Shopsy marketplaces.' },
      ],
    },
    {
      id: uuidv4(),
      type: 'social',
      enabled: true,
      title: 'Follow our journey',
      eyebrow: '@ady_trix',
      text: 'Join our community on Instagram and Facebook for new arrivals, festive inspiration and styling ideas.',
    },
  ],
  footer: {
    tagline: 'Where Tradition Meets Beauty',
    description: 'Premium artificial flowers, festive torans, decorative hangings and lifestyle products from ADYTRIX.',
    phone: '',
    email: '',
    instagram: 'https://www.instagram.com/ady_trix',
    facebook: 'https://www.facebook.com/share/17aSzr2VLj/',
  },
  updatedAt: new Date(),
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG))
}

export async function getSiteConfig() {
  const db = await getDb()
  const doc = await db.collection('site_config').findOne({ key: 'main' })
  if (!doc) return cloneDefault()
  const { _id, ...rest } = doc
  return {
    ...cloneDefault(),
    ...rest,
    announcement: { ...cloneDefault().announcement, ...(rest.announcement || {}) },
    header: { ...cloneDefault().header, ...(rest.header || {}) },
    hero: { ...cloneDefault().hero, ...(rest.hero || {}) },
    footer: { ...cloneDefault().footer, ...(rest.footer || {}) },
    sections: Array.isArray(rest.sections) ? rest.sections : cloneDefault().sections,
  }
}

export async function saveSiteConfig(config, adminId = null) {
  const db = await getDb()
  const now = new Date()
  const clean = {
    key: 'main',
    announcement: config.announcement || cloneDefault().announcement,
    header: config.header || cloneDefault().header,
    hero: config.hero || cloneDefault().hero,
    sections: Array.isArray(config.sections) ? config.sections : cloneDefault().sections,
    footer: config.footer || cloneDefault().footer,
    updatedAt: now,
  }
  await db.collection('site_config').updateOne(
    { key: 'main' },
    { $set: clean, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  return clean
}
