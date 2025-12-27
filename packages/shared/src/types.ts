// Shared types for ASKED Store

export interface AuthResponse {
  token: string
  user: UserProfile
}

export interface UserProfile {
  id: string
  tgId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  roles: string[] // Array of role names
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  sub: string // User ID (userId)
  tgId: string
  roles: string[] // Array of role names
  iat?: number
  exp?: number
}

