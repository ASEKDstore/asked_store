export type ProductStatus = 'draft' | 'published'

export type Product = {
  id: string
  article: string // Артикул товара
  title: string
  price: number // integer or float, store as number
  oldPrice?: number // optional
  description?: string
  images: string[] // URLs
  tags?: string[] // optional
  status: ProductStatus // draft/published
  createdAt: number
  updatedAt: number
}

export type ProductsPersistV1 = {
  schemaVersion: 1
  items: Product[]
}

