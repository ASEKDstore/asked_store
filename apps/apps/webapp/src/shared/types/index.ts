export interface User {
  id: string
  tgId: string
  username?: string
  firstName?: string
  lastName?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  ok: boolean
  token: string
  user: User
}