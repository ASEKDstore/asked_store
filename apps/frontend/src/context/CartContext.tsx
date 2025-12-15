import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '../data/products'

export type CartItem = {
  productId: string
  article: string
  title: string
  price: number
  image: string
  size?: string
  qty: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (p: Product, opts?: { size?: string; qty?: number }) => void
  removeItem: (productId: string, size?: string) => void
  setQty: (productId: string, size: string | undefined, qty: number) => void
  clear: () => void
  totalQty: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'asked_cart_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem: CartContextValue['addItem'] = (p, opts) => {
    const size = opts?.size
    const qtyToAdd = Math.max(1, opts?.qty ?? 1)

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.id && x.size === size)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qtyToAdd }
        return copy
      }
      return [
        ...prev,
        {
          productId: p.id,
          article: p.article,
          title: p.title,
          price: p.price,
          image: p.image,
          size,
          qty: qtyToAdd,
        },
      ]
    })
  }

  const removeItem: CartContextValue['removeItem'] = (productId, size) => {
    setItems((prev) =>
      prev.filter((x) => !(x.productId === productId && x.size === size))
    )
  }

  const setQty: CartContextValue['setQty'] = (productId, size, qty) => {
    const safeQty = Math.max(1, qty)
    setItems((prev) =>
      prev.map((x) =>
        x.productId === productId && x.size === size ? { ...x, qty: safeQty } : x
      )
    )
  }

  const clear = () => setItems([])

  const { totalQty, totalPrice } = useMemo(() => {
    const totalQty = items.reduce((s, x) => s + x.qty, 0)
    const totalPrice = items.reduce((s, x) => s + x.qty * x.price, 0)
    return { totalQty, totalPrice }
  }, [items])

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    setQty,
    clear,
    totalQty,
    totalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}




