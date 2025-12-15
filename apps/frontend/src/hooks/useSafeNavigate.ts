import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook для безопасной навигации с защитой от двойных кликов
 * Предотвращает race conditions и множественные navigate вызовы
 */
export function useSafeNavigate() {
  const navigate = useNavigate()
  const lock = useRef(false)

  return (to: string) => {
    if (lock.current) return
    
    lock.current = true
    navigate(to)
    
    // Разблокируем после следующего кадра
    requestAnimationFrame(() => {
      lock.current = false
    })
  }
}

