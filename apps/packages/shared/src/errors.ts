// Error types for ASKED Store API
// Version: 1.0.0

/**
 * API Error - general API error response
 */
export interface ApiError {
  error: string // Error message
  details?: unknown // Optional error details
  code?: string // Optional error code
  statusCode?: number // Optional HTTP status code
}

/**
 * Validation Error - field validation error details
 */
export interface ValidationError {
  field: string // Field name that failed validation
  message: string // Validation error message
  code?: string // Optional validation error code
}

/**
 * Validation Error Response - response format for validation errors
 */
export interface ValidationErrorResponse {
  error: string // General error message (e.g., "Validation failed")
  details: ValidationError[] // Array of field validation errors
  code?: string // Optional error code
  statusCode?: number // HTTP status code (usually 400)
}

/**
 * Check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'string'
  )
}

/**
 * Check if error is ValidationErrorResponse
 */
export function isValidationErrorResponse(error: unknown): error is ValidationErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'details' in error &&
    Array.isArray((error as ValidationErrorResponse).details)
  )
}

