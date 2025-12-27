// Shared DTOs and types for ASKED Store
// Version: 1.0.0

/**
 * User DTO - represents a user in the system
 */
export interface UserDTO {
  id: string
  tgId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  roles: string[] // Array of role names
  createdAt: string // ISO 8601 date string
  updatedAt: string // ISO 8601 date string
}

/**
 * Role DTO - represents a role in the RBAC system
 */
export interface RoleDTO {
  id: string
  name: string
  description: string | null
  createdAt: string // ISO 8601 date string
  updatedAt: string // ISO 8601 date string
}

/**
 * Auth Response DTO - response from POST /auth/telegram
 */
export interface AuthResponseDTO {
  token: string // JWT token
  user: UserDTO
}

/**
 * JWT Payload - structure of JWT token payload
 */
export interface JWTPayload {
  sub: string // User ID (userId)
  tgId: string
  roles: string[] // Array of role names
  iat?: number // Issued at timestamp
  exp?: number // Expiration timestamp
}

// Legacy exports for backward compatibility (deprecated)
/**
 * @deprecated Use UserDTO instead
 */
export type UserProfile = UserDTO

/**
 * @deprecated Use AuthResponseDTO instead
 */
export interface AuthResponse {
  token: string
  user: UserDTO
}

