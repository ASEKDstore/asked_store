import { requestJson } from '../lib/apiClient'

export type Product = {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  sku?: string
  article?: string
  isActive: boolean
  status?: string
  categories?: Array<{
    id: string
    name: string
    slug: string
  }>
  createdAt: string
  updatedAt: string
}

export type Category = {
  id: string
  name: string
  slug: string
}

export async function getPublicProducts(params?: {
  categoryId?: string
  categorySlug?: string
  inStock?: boolean
  search?: string
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest'
}): Promise<Product[]> {
  const queryParams = new URLSearchParams()
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId)
  if (params?.categorySlug) queryParams.append('categorySlug', params.categorySlug)
  if (params?.inStock !== undefined) queryParams.append('inStock', String(params.inStock))
  if (params?.search) queryParams.append('search', params.search)
  if (params?.sort) queryParams.append('sort', params.sort)
  
  const query = queryParams.toString()
  return requestJson<Product[]>(`/api/public/products${query ? `?${query}` : ''}`)
}

export async function getPublicProduct(id: string): Promise<Product> {
  return requestJson<Product>(`/api/public/products/${id}`)
}

export async function getPublicCategories(): Promise<Category[]> {
  return requestJson<Category[]>('/api/public/categories')
}

