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

/**
 * Fetch with timeout and AbortController
 * @param url - Request URL
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 3000)
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 3000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

export default apiUrl

