import { useEffect, useRef } from 'react'
import { getTelegramWebApp } from './tg'

interface MainButtonOptions {
  text: string
  onClick: () => void
  color?: string
  textColor?: string
}

/**
 * Hook для управления Telegram MainButton
 */
export function useTgMainButton(options: MainButtonOptions | null) {
  const tg = getTelegramWebApp()
  const onClickRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!tg?.MainButton) return

    const mainButton = tg.MainButton

    if (!options) {
      mainButton.hide()
      return
    }

    // Сохраняем текущий обработчик
    onClickRef.current = options.onClick

    // Устанавливаем параметры кнопки
    const params: { text?: string; color?: string; text_color?: string } = {
      text: options.text,
    }
    if (options.color) {
      params.color = options.color
    }
    if (options.textColor) {
      params.text_color = options.textColor
    }
    mainButton.setParams(params)

    // Обработчик клика с haptic feedback
    const handleClick = () => {
      // Haptic feedback
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light')
      }

      // Вызываем callback
      if (onClickRef.current) {
        onClickRef.current()
      }
    }

    mainButton.onClick(handleClick)
    mainButton.show()
    mainButton.enable()

    return () => {
      mainButton.offClick(handleClick)
      mainButton.hide()
    }
  }, [tg, options])

  // Методы для управления кнопкой
  return {
    setProgress: (loading: boolean) => {
      if (!tg?.MainButton) return
      if (loading) {
        tg.MainButton.showProgress()
      } else {
        tg.MainButton.hideProgress()
      }
    },
    show: () => {
      if (!tg?.MainButton) return
      tg.MainButton.show()
    },
    hide: () => {
      if (!tg?.MainButton) return
      tg.MainButton.hide()
    },
  }
}
