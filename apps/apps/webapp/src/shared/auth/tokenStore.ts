/**
 * Хранилище токена авторизации
 */

const TOKEN_KEY = 'asked_store_token'

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  set(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, token)
  },

  remove(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
  },

  has(): boolean {
    return !!this.get()
  },
}
