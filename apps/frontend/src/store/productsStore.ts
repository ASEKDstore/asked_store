import type { Product, ProductsPersistV1 } from '../types/adminProduct'

const STORAGE_KEY = 'asked.products'
const SCHEMA_VERSION = 1

// Debounce для persist
let persistTimer: ReturnType<typeof setTimeout> | null = null
const PERSIST_DEBOUNCE_MS = 300

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

function persistDebounced(items: Product[]): void {
  if (persistTimer) {
    clearTimeout(persistTimer)
  }

  persistTimer = setTimeout(() => {
    try {
      const data: ProductsPersistV1 = {
        schemaVersion: SCHEMA_VERSION,
        items,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to persist products:', err)
    }
  }, PERSIST_DEBOUNCE_MS)
}

function seedDemoProducts(): Product[] {
  // Seed данные только для dev (если localStorage пустой)
  return [
    {
      id: 'prod-demo-1',
      article: 'ASK-001-BLK',
      title: 'ASKED Hoodie Black',
      price: 8990,
      oldPrice: 11990,
      description: 'Премиум худи из качественного материала',
      images: ['/assets/product-1.jpg'],
      tags: ['hoodie', 'black', 'premium'],
      status: 'published',
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'prod-demo-2',
      article: 'ASK-002-WHT',
      title: 'ASKED T-Shirt White',
      price: 2990,
      description: 'Классическая белая футболка',
      images: ['/assets/product-2.jpg'],
      tags: ['tshirt', 'white'],
      status: 'draft',
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
  ]
}

function hydrate(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Seed demo products только если localStorage пустой (dev mode)
      if (process.env.NODE_ENV === 'development') {
        const seed = seedDemoProducts()
        if (seed.length > 0) {
          const data: ProductsPersistV1 = {
            schemaVersion: SCHEMA_VERSION,
            items: seed,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          return seed
        }
      }
      return []
    }

    const parsed = safeJsonParse<ProductsPersistV1 | Product[]>(stored, [])

    // Миграция: если массив без обёртки
    if (Array.isArray(parsed)) {
      // Нормализуем старые товары: добавляем article если отсутствует
      const normalized = parsed.map((p: any) => ({
        ...p,
        article: String(p.article ?? ''),
        title: String(p.title ?? ''),
        description: p.description ? String(p.description) : undefined,
        images: Array.isArray(p.images) ? p.images : [],
        tags: Array.isArray(p.tags) ? p.tags : undefined,
        status: p.status ?? 'draft',
      }))
      const migrated: ProductsPersistV1 = {
        schemaVersion: SCHEMA_VERSION,
        items: normalized,
      }
      // Сохраняем мигрированные данные
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return normalized
    }

    // Если формат с обёрткой
    if (parsed && typeof parsed === 'object' && 'items' in parsed && Array.isArray(parsed.items)) {
      // Нормализуем товары: добавляем article если отсутствует
      return parsed.items.map((p: any) => ({
        ...p,
        article: String(p.article ?? ''),
        title: String(p.title ?? ''),
        description: p.description ? String(p.description) : undefined,
        images: Array.isArray(p.images) ? p.images : [],
        tags: Array.isArray(p.tags) ? p.tags : undefined,
        status: p.status ?? 'draft',
      }))
    }

    // Неожиданный формат - начинаем с пустого
    return []
  } catch (err) {
    console.error('Failed to hydrate products:', err)
    return []
  }
}

type ProductsState = {
  items: Product[]
  addProduct: (p: Product) => void
  updateProduct: (id: string, patch: Partial<Omit<Product, 'id' | 'createdAt'>>) => void
  deleteProduct: (id: string) => void
  getById: (id: string) => Product | undefined
  hydrate: () => void
}

// Простой store на основе замыканий (без zustand для простоты)
let state: Product[] = []
let listeners: Set<() => void> = new Set()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export const productsStore: ProductsState = {
  get items() {
    return state
  },

  hydrate() {
    state = hydrate()
    notify()
  },

  addProduct(p: Product) {
    state = [...state, p]
    persistDebounced(state)
    notify()
  },

  updateProduct(id: string, patch: Partial<Omit<Product, 'id' | 'createdAt'>>) {
    state = state.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            updatedAt: Date.now(),
          }
        : item
    )
    persistDebounced(state)
    notify()
  },

  deleteProduct(id: string) {
    state = state.filter((item) => item.id !== id)
    persistDebounced(state)
    notify()
  },

  getById(id: string) {
    return state.find((item) => item.id === id)
  },
}

// Импорт React для хука
import { useEffect, useReducer } from 'react'

// React hook для подписки на изменения
export function useProductsStore(): ProductsState {
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    const listener = () => forceUpdate()
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return productsStore
}

