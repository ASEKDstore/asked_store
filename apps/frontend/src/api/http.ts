/**
 * HTTP utility functions for type-safe API responses
 */

/**
 * Type-safe JSON response parser
 * @param res - Fetch Response object
 * @returns Parsed JSON data with type T
 * @throws Error if response is not ok
 */
export async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

