import { apiUrl } from '../utils/api'

export interface LabArtist {
  id: string
  name: string
  avatar?: string
  bio: string
  links: Array<{ title: string; url: string }>
  currentWork?: string // "Сейчас в работе" - над чем работает художник
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface LabProduct {
  id: string
  artistId: string
  title: string
  description: string
  price: number
  images: string[]
  tags: string[]
  available: boolean
  createdAt: string
  updatedAt: string
}

export async function getLabArtists(): Promise<LabArtist[]> {
  const response = await fetch(apiUrl('/api/lab/artists'))
  if (!response.ok) {
    throw new Error('Failed to fetch lab artists')
  }
  return response.json()
}

export async function getLabProducts(artistId?: string): Promise<LabProduct[]> {
  const url = artistId
    ? apiUrl(`/api/lab/products?artistId=${artistId}`)
    : apiUrl('/api/lab/products')
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch lab products')
  }
  return response.json()
}

