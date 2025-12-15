// LAB Artist
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

export interface CreateLabArtistRequest {
  name: string
  avatar?: string
  bio: string
  links?: Array<{ title: string; url: string }>
  currentWork?: string
  active?: boolean
}

export interface UpdateLabArtistRequest extends Partial<CreateLabArtistRequest> {}

// LAB Product (кастом)
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

export interface CreateLabProductRequest {
  artistId: string
  title: string
  description: string
  price: number
  images?: string[]
  tags?: string[]
  available?: boolean
}

export interface UpdateLabProductRequest extends Partial<CreateLabProductRequest> {}

// LAB Data Structure
export interface LabData {
  artists: LabArtist[]
  labProducts: LabProduct[]
}
