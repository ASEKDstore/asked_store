import { useState, useEffect, useRef } from 'react'
import './LabLoadingScreen.css'

interface LabLoadingScreenProps {
  loading: boolean
  subtitle?: string
}

export const LabLoadingScreen = ({ loading, subtitle = 'Готовим кастом...' }: LabLoadingScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    // Clear previous timers
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (!loading) {
      // Когда загрузка завершена, быстро доходим до 100%
      setProgress(1)
      
      // Плавно скрываем через 300мс
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false)
        hideTimerRef.current = null
      }, 300)
    } else {
      // Показываем loader при начале загрузки
      setIsVisible(true)
      setProgress(0)
      
      // Плавно увеличиваем прогресс до 90% пока loading=true
      if (!prefersReducedMotion) {
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            // Плавный рост, но не выше 0.9
            const increment = Math.random() * 0.02 + 0.01
            return Math.min(prev + increment, 0.9)
          })
        }, 100)
      } else {
        // Если анимации выключены, просто показываем 90%
        setProgress(0.9)
      }
    }

    return () => {
      if (progressIntervalRef.current !== null) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [loading, prefersReducedMotion])

  if (!isVisible) {
    return null
  }

  return (
    <div className={`lab-loading-screen ${isVisible ? 'is-visible' : ''}`} aria-busy="true">
      <div className="lab-loading-backdrop" />
      <div className="lab-loading-card">
        <div className="lab-loading-logo">
          <span className="lab-loading-logo-text">ASKED</span>
          <span className="lab-loading-logo-label">LAB</span>
        </div>
        
        <div className="lab-loading-content">
          <div className="lab-loading-title">Загрузка...</div>
          <div className="lab-loading-subtitle">{subtitle}</div>
          
          {!prefersReducedMotion && (
            <div className="lab-loading-progress">
              <div 
                className="lab-loading-progress-bar" 
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Skeleton блоки для предпросмотра контента */}
        <div className="lab-loading-skeletons">
          <div className="lab-loading-skeleton lab-loading-skeleton--hero" />
          <div className="lab-loading-skeleton lab-loading-skeleton--card" />
          <div className="lab-loading-skeleton lab-loading-skeleton--card" />
        </div>
      </div>
    </div>
  )
}



