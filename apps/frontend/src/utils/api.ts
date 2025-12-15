/**
 * Unified API base URL utility
 * 
 * In development: uses Vite proxy (API_BASE = "")
 * In production: uses VITE_API_URL or VITE_API_BASE env variable
 */
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? (import.meta as any).env?.VITE_API_BASE ?? ''

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
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // Remove trailing slash from API_BASE if present
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  // In production, prepend API_BASE
  return `${base}${normalizedPath}`
}

export default apiUrl

