// Shared types and utilities

export type User = {
  id: string
  telegramId: string
  firstName?: string
  lastName?: string
  username?: string
  avatarUrl?: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  oldPrice?: number
  images: string[]
  categoryId?: string
  sku?: string
  stock: number
  isActive: boolean
  isFeatured: boolean
  sizes: string[]
  colors: string[]
}

export type Order = {
  id: string
  userId: string
  status: string
  total: number
  subtotal: number
  shipping: number
  createdAt: string
}

export type Banner = {
  id: string
  title?: string
  description?: string
  imageUrl: string
  linkUrl?: string
  linkType?: string
  isActive: boolean
}


