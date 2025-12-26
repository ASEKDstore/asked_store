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
  roles: string[] // Array of role names
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  tgId: string
  userId: string
  role: string
  iat?: number
  exp?: number
}

