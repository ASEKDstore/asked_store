import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTelegramWebApp } from './tg'

/**
 * Hook для управления Telegram BackButton
 * Показывает кнопку "назад" только когда есть куда возвращаться
 */
export function useTgBackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const tg = getTelegramWebApp()

  useEffect(() => {
    if (!tg?.BackButton) return

    const backButton = tg.BackButton

    // Определяем, можно ли вернуться назад
    // В React Router это обычно проверяется через history или состояние
    // Для простоты: скрываем на корневых маршрутах
    const canGoBack = location.pathname !== '/' && location.pathname !== '/home'

    if (canGoBack) {
      backButton.show()

      const handleBack = () => {
        navigate(-1)
      }

      backButton.onClick(handleBack)

      return () => {
        backButton.offClick(handleBack)
        backButton.hide()
      }
    } else {
      backButton.hide()
    }
  }, [navigate, location.pathname, tg])
}
