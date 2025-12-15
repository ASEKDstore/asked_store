import { v4 as uuidv4 } from 'uuid'
import { readJson, writeJson } from './jsonDb.js'

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

interface LabData {
  artists: LabArtist[]
  labProducts: LabProduct[]
}

const DEFAULT_LAB_DATA: LabData = {
  artists: [],
  labProducts: [],
}

async function getLabData(): Promise<LabData> {
  const data = await readJson<LabData>('lab', DEFAULT_LAB_DATA)
  if (!data || !data.artists || !data.labProducts) {
    await writeJson('lab', DEFAULT_LAB_DATA)
    return DEFAULT_LAB_DATA
  }
  return data
}

// ========== ARTISTS ==========

export async function listArtists(options: { onlyActive?: boolean } = {}): Promise<LabArtist[]> {
  const data = await getLabData()
  let artists = data.artists
  
  if (options.onlyActive) {
    artists = artists.filter(a => a.active)
  }
  
  return artists
}

export async function getArtist(id: string): Promise<LabArtist | null> {
  const data = await getLabData()
  return data.artists.find(a => a.id === id) || null
}

export async function createArtist(payload: {
  name: string
  avatar?: string
  bio?: string
  links?: Array<{ title: string; url: string }>
  currentWork?: string
  active?: boolean
}): Promise<LabArtist> {
  if (!payload.name) {
    throw new Error('Name is required')
  }
  
  const data = await getLabData()
  
  const artist: LabArtist = {
    id: uuidv4(),
    name: payload.name,
    avatar: payload.avatar,
    bio: payload.bio || '',
    links: Array.isArray(payload.links) ? payload.links : [],
    currentWork: payload.currentWork,
    active: payload.active ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  data.artists.push(artist)
  await writeJson('lab', data)
  
  return artist
}

export async function updateArtist(id: string, patch: Partial<Omit<LabArtist, 'id' | 'createdAt'>>): Promise<LabArtist> {
  const data = await getLabData()
  const index = data.artists.findIndex(a => a.id === id)
  
  if (index === -1) {
    throw new Error('Artist not found')
  }
  
  // Ensure arrays are arrays
  if (patch.links !== undefined && !Array.isArray(patch.links)) {
    patch.links = []
  }
  
  data.artists[index] = {
    ...data.artists[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  
  await writeJson('lab', data)
  
  return data.artists[index]
}

export async function deleteArtist(id: string): Promise<void> {
  const data = await getLabData()
  
  // Check if artist has products
  const hasProducts = data.labProducts.some(p => p.artistId === id)
  if (hasProducts) {
    throw new Error('Cannot delete artist with existing products')
  }
  
  const index = data.artists.findIndex(a => a.id === id)
  if (index === -1) {
    throw new Error('Artist not found')
  }
  
  data.artists.splice(index, 1)
  await writeJson('lab', data)
}

// ========== LAB PRODUCTS ==========

export async function listLabProducts(options: { artistId?: string; onlyAvailable?: boolean } = {}): Promise<LabProduct[]> {
  const data = await getLabData()
  let products = data.labProducts
  
  if (options.artistId) {
    products = products.filter(p => p.artistId === options.artistId)
  }
  
  if (options.onlyAvailable) {
    products = products.filter(p => p.available)
  }
  
  return products
}

export async function getLabProduct(id: string): Promise<LabProduct | null> {
  const data = await getLabData()
  return data.labProducts.find(p => p.id === id) || null
}

export async function createLabProduct(payload: {
  artistId: string
  title: string
  description?: string
  price: number
  images?: string[]
  tags?: string[]
  available?: boolean
}): Promise<LabProduct> {
  if (!payload.title || !payload.artistId || payload.price === undefined) {
    throw new Error('Title, artistId, and price are required')
  }
  
  if (payload.price < 0) {
    throw new Error('Price must be >= 0')
  }
  
  const data = await getLabData()
  
  // Verify artist exists
  const artist = data.artists.find(a => a.id === payload.artistId)
  if (!artist) {
    throw new Error('Artist not found')
  }
  
  const product: LabProduct = {
    id: uuidv4(),
    artistId: payload.artistId,
    title: payload.title,
    description: payload.description || '',
    price: payload.price,
    images: Array.isArray(payload.images) ? payload.images : [],
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    available: payload.available ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  data.labProducts.push(product)
  await writeJson('lab', data)
  
  return product
}

export async function updateLabProduct(id: string, patch: Partial<Omit<LabProduct, 'id' | 'createdAt'>>): Promise<LabProduct> {
  const data = await getLabData()
  const index = data.labProducts.findIndex(p => p.id === id)
  
  if (index === -1) {
    throw new Error('Lab product not found')
  }
  
  // Validate price if provided
  if (patch.price !== undefined && patch.price < 0) {
    throw new Error('Price must be >= 0')
  }
  
  // If artistId is being updated, verify new artist exists
  if (patch.artistId && patch.artistId !== data.labProducts[index].artistId) {
    const artist = data.artists.find(a => a.id === patch.artistId)
    if (!artist) {
      throw new Error('Artist not found')
    }
  }
  
  // Ensure arrays are arrays
  if (patch.images !== undefined && !Array.isArray(patch.images)) {
    patch.images = []
  }
  if (patch.tags !== undefined && !Array.isArray(patch.tags)) {
    patch.tags = []
  }
  
  data.labProducts[index] = {
    ...data.labProducts[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  
  await writeJson('lab', data)
  
  return data.labProducts[index]
}

export async function deleteLabProduct(id: string): Promise<void> {
  const data = await getLabData()
  const index = data.labProducts.findIndex(p => p.id === id)
  
  if (index === -1) {
    throw new Error('Lab product not found')
  }
  
  data.labProducts.splice(index, 1)
  await writeJson('lab', data)
}

// ========== SEED ==========

export async function seedIfEmpty(): Promise<void> {
  const data = await getLabData()
  
  // Seed artists if empty
  if (data.artists.length === 0) {
    const anastasia = await createArtist({
      name: 'Анастасия',
      bio: 'Кастомы и ручная роспись одежды/аксессуаров. Аэрограф + кисти. Каждый кастом уникален.',
      links: [
        { title: 'Telegram', url: '#' },
        { title: 'Portfolio', url: '#' },
      ],
      active: true,
    })
    
    // Seed lab products if empty
    if (data.labProducts.length === 0) {
      await createLabProduct({
        artistId: anastasia.id,
        title: 'Hoodie — Chrome Drips',
        description: 'Работа выполнена аэрографом с использованием хромированных красок.',
        price: 5000,
        images: ['/assets/lab-work-1.jpg'],
        tags: ['hoodie', 'airbrush'],
        available: true,
      })
      
      await createLabProduct({
        artistId: anastasia.id,
        title: 'Tee — Rune Lines',
        description: 'Ручная роспись акриловыми красками по ткани.',
        price: 3000,
        images: ['/assets/lab-work-2.jpg'],
        tags: ['tshirt'],
        available: true,
      })
      
      await createLabProduct({
        artistId: anastasia.id,
        title: 'Sneakers — Split Ink',
        description: 'Кастом кроссовок с эффектом разлитых чернил.',
        price: 8000,
        images: ['/assets/lab-work-3.jpg'],
        tags: ['sneakers'],
        available: true,
      })
    }
  }
}
