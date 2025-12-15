/**
 * Unified API base URL utility
 * 
 * In development: uses Vite proxy (API_BASE = "")
 * In production: uses VITE_API_BASE env variable
 */
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? ''

/**
 * Constructs full API URL
 * @param path - API path (e.g., "/api/orders")
 * @returns Full URL if API_BASE is set, or relative path for Vite proxy
 */
export const apiUrl = (path: string): string => {
  // If API_BASE is empty, use relative path (Vite proxy in dev)
  if (!API_BASE) {
    return path
  }
  // In production, prepend API_BASE
  return `${API_BASE}${path}`
}

export default apiUrl

