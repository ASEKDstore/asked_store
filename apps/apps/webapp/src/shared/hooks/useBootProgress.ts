import { useState, useEffect, useRef, useCallback } from 'react'

type BootStage = 'telegram' | 'auth' | 'config' | 'ready'

const STAGE_PROGRESS: Record<BootStage, number> = {
  telegram: 20,
  auth: 50,
  config: 80,
  ready: 100,
}

/**
 * Hook для управления прогрессом загрузки
 * Прогресс плавно доезжает до целевого значения и никогда не откатывается назад
 */
export function useBootProgress() {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState<BootStage | null>(null)
  const targetProgressRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  // Плавная анимация прогресса через requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      setProgress((current) => {
        const target = targetProgressRef.current

        // Если уже достигли цели, останавливаемся
        if (current >= target) {
          animationFrameRef.current = null
          return target
        }

        // Easing: ease-out (быстро в начале, медленно в конце)
        const distance = target - current
        const speed = Math.max(0.8, distance * 0.08) // Минимальная скорость 0.8% за кадр
        const step = Math.min(speed, distance)

        const newProgress = current + step

        // Продолжаем анимацию
        animationFrameRef.current = requestAnimationFrame(animate)

        return Math.min(newProgress, target)
      })
    }

    // Запускаем анимацию если есть цель и она не достигнута
    if (progress < targetProgressRef.current && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [progress])

  const setStage = useCallback((stage: BootStage) => {
    const targetProgress = STAGE_PROGRESS[stage]

    // Прогресс никогда не откатывается назад
    if (targetProgress > targetProgressRef.current) {
      targetProgressRef.current = targetProgress
      setCurrentStage(stage)
    }
  }, [])

  const reset = useCallback(() => {
    setProgress(0)
    setCurrentStage(null)
    targetProgressRef.current = 0
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  return {
    progress: Math.round(progress),
    currentStage,
    setStage,
    reset,
  }
}