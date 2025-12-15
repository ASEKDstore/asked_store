import { useUser } from '../context/UserContext'

/**
 * Безопасный хук для получения Telegram ID
 * @returns number | null
 */
export function useTgId(): number | null {
  const { user } = useUser()
  return user?.id ?? null
}

/**
 * Проверка, является ли пользователь админом
 * @param tgId - Telegram ID пользователя
 * @returns boolean
 */
export function isAdmin(tgId: number | null): boolean {
  return tgId === 930749603
}



