import { useState, useEffect, useRef } from 'react'
import { useSafeNavigate } from '../../hooks/useSafeNavigate'
import { requestJson } from '../../lib/apiClient'
import './banners.css'

type Banner = {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  ctaText?: string
  detailsImage?: string
  isActive?: boolean
  order?: number
}

export const Banners = () => {
  const safeNavigate = useSafeNavigate()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const navigateLockRef = useRef(false)

  // Загрузка баннеров из API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true)
        const data = await requestJson<Banner[]>('/api/banners', {
          skipAuth: true, // Публичный endpoint
        })
        // Фильтруем только активные баннеры (на всякий случай, хотя API уже фильтрует)
        const activeBanners = data.filter(b => b.isActive !== false)
        setBanners(activeBanners)
        setActive(0) // Сбрасываем активный слайд
      } catch (error) {
        console.error('[Banners] Failed to load banners:', error)
        setBanners([]) // При ошибке показываем пустой массив
      } finally {
        setLoading(false)
      }
    }
    loadBanners()
  }, [])

  // Автопрокрутка
  useEffect(() => {
    if (isPaused || banners.length <= 1) return

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length)
    }, 5500)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [isPaused])

  // Обработка свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsPaused(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const diff = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Свайп влево - следующий слайд
        setActive((prev) => (prev + 1) % banners.length)
      } else {
        // Свайп вправо - предыдущий слайд
        setActive((prev) => (prev - 1 + banners.length) % banners.length)
      }
    }

    touchStartX.current = null
    touchEndX.current = null
    setIsPaused(false)
  }

  // Обработка drag мышкой
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX
    setIsPaused(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current === null) return
    touchEndX.current = e.clientX
  }

  const handleMouseUp = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const diff = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        setActive((prev) => (prev + 1) % banners.length)
      } else {
        setActive((prev) => (prev - 1 + banners.length) % banners.length)
      }
    }

    touchStartX.current = null
    touchEndX.current = null
    setIsPaused(false)
  }

  const handleDotClick = (index: number) => {
    setActive(index)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 2000)
  }

  // Если баннеров нет - не рендерить блок
  if (loading) {
    return null // Можно показать скелетон, но по требованию - просто не показывать
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <section className="banners">
      <div
        className="banners-track"
        style={{ transform: `translateX(-${active * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {banners.map((b) => (
          <div className="banner" key={b.id}>
            <div
              className="banner-bg"
              style={{ backgroundImage: `url(${b.image})` }}
            />
            <div className="banner-overlay" />
            <div className="banner-content">
              {b.subtitle && (
                <div className="banner-sub">{b.subtitle}</div>
              )}
              <div className="banner-title">{b.title}</div>
              <button
                className="banner-cta"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  // Защита от двойного клика
                  if (navigateLockRef.current) return
                  navigateLockRef.current = true
                  
                  safeNavigate(`/app/banner/${b.id}`)
                  
                  // Снимаем блокировку через 400мс
                  setTimeout(() => {
                    navigateLockRef.current = false
                  }, 400)
                }}
              >
                {b.ctaText ?? 'Подробнее'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="banners-dots">
        {banners.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === active ? 'dot--active' : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}


