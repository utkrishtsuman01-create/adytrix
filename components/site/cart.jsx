'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartContext = createContext(null)
const KEY = 'adytrix_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
    }
  }, [items, ready])

  const addItem = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i)
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: (product.images && product.images[0]) || '',
        price: Number(product.discountedPrice ?? product.mrp),
        mrp: Number(product.mrp),
        quantity: qty,
      }]
    })
  }, [])

  const updateQty = useCallback((productId, quantity) => {
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(99, quantity)) } : i))
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((a, i) => a + i.quantity, 0)
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, ready, addItem, updateQty, removeItem, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
