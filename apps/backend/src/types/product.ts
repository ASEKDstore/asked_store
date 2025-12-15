export interface Product {
  id: string
  article: string
  title: string
  shortTitle?: string
  price: number
  image: string
  images: string[]
  description?: string
  sizes: string[]
  category: string
  tags: string[]
  available: boolean
  featured: boolean
  badge?: string
  cardAccent?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  article: string
  title: string
  shortTitle?: string
  price: number
  image: string
  images?: string[]
  description?: string
  sizes?: string[]
  category: string
  tags?: string[]
  available?: boolean
  featured?: boolean
  badge?: string
  cardAccent?: string
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}



