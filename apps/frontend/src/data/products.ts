// Legacy type - kept for backward compatibility with existing components
// Real products are loaded from API via productsApi.ts
export type Product = {
  id: string
  article: string // АРТИКУЛ
  title: string
  price: number
  oldPrice?: number // Старая цена (если есть скидка)
  image: string
  images?: string[] // Галерея фото
  description: string
  sizes: string[]
  category: 'hoodie' | 'tshirt' | 'pants' | 'custom' | 'accessories' | 'headwear'
  tags: string[]
  available: boolean
  inStock?: boolean // Альтернативное название для available
}

// No mock products - all products are loaded from API
export const products: Product[] = []

export default products

