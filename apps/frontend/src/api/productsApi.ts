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

// UI Product type (for backward compatibility with existing components)
export type UIProduct = {
  id: string
  article: string
  title: string
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  description: string
  sizes: string[]
  category: 'hoodie' | 'tshirt' | 'pants' | 'custom' | 'accessories' | 'headwear'
  tags: string[]
  available: boolean
  inStock?: boolean
}

// Map API Product to UI Product format
export function mapApiProductToUI(apiProduct: Product): UIProduct {
  // Default sizes if not available in API
  const defaultSizes = ['S', 'M', 'L', 'XL']
  
  // Map category slug to UI category
  const categorySlug = apiProduct.categories?.[0]?.slug || 'custom'
  const categoryMap: Record<string, UIProduct['category']> = {
    'hoodie': 'hoodie',
    'tshirt': 'tshirt',
    'pants': 'pants',
    'custom': 'custom',
    'accessories': 'accessories',
    'headwear': 'headwear',
  }
  const category = categoryMap[categorySlug] || 'custom'
  
  // Get first image as main image
  const image = apiProduct.images?.[0] || '/assets/placeholder-product.jpg'
  
  return {
    id: apiProduct.id,
    article: apiProduct.article || apiProduct.sku || `ASK-${apiProduct.id.slice(0, 6).toUpperCase()}`,
    title: apiProduct.title,
    price: apiProduct.price,
    oldPrice: undefined, // API doesn't have oldPrice yet
    image,
    images: apiProduct.images.length > 0 ? apiProduct.images : [image],
    description: apiProduct.description || '',
    sizes: defaultSizes, // TODO: Add sizes to API
    category,
    tags: [], // TODO: Add tags to API
    available: apiProduct.isActive && apiProduct.status === 'published',
    inStock: apiProduct.isActive && apiProduct.status === 'published',
  }
}

// Get products and map to UI format
export async function getUIProducts(params?: {
  categoryId?: string
  categorySlug?: string
  inStock?: boolean
  search?: string
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest'
}): Promise<UIProduct[]> {
  const products = await getPublicProducts(params)
  return products.map(mapApiProductToUI)
}

// Get single product and map to UI format
export async function getUIProduct(id: string): Promise<UIProduct | null> {
  try {
    const product = await getPublicProduct(id)
    return mapApiProductToUI(product)
  } catch (error) {
    console.error('Failed to load product:', error)
    return null
  }
}

