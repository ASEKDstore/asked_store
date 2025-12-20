import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { requestJson } from '../lib/apiClient'
import type { Banner } from '../data/banners'
import './BannerDetailsPage.css'

export const BannerDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [banner, setBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  // Свайп назад
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Загрузка баннера из API
  useEffect(() => {
    const loadBanner = async () => {
      if (!id) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const banners = await requestJson<Banner[]>('/api/banners', {
          skipAuth: true,
        })
        const foundBanner = banners.find((b) => b.id === id)
        setBanner(foundBanner || null)
      } catch (error) {
        console.error('[BannerDetailsPage] Failed to load banner:', error)
        setBanner(null)
      } finally {
        setLoading(false)
      }
    }
    loadBanner()
  }, [id])

  // Анимация входа
  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => setMounted(true))
    }
  }, [loading])
  
  // Если баннер не найден после загрузки - редирект
  useEffect(() => {
    if (!loading && !banner && id) {
      navigate('/app', { replace: true })
    }
  }, [loading, banner, id, navigate])

  // Обработка свайпа назад
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY

    // Визуальная обратная связь: слегка сдвигаем карточку
    if (touchStartX.current !== null && touchStartX.current < 30) {
      const diffX = touchEndX.current - touchStartX.current
      if (diffX > 0 && cardRef.current) {
        const translateX = Math.min(diffX * 0.3, 40)
        cardRef.current.style.transform = `translateX(${translateX}px)`
      }
    }
  }

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      return
    }

    const diffX = touchEndX.current - touchStartX.current
    const diffY = Math.abs(touchEndY.current - touchStartY.current)

    // Условия для свайпа назад:
    // - старт с левого края (clientX < 30)
    // - движение вправо > 90px
    // - вертикальное смещение < 40px
    if (
      touchStartX.current < 30 &&
      diffX > 90 &&
      diffY < 40
    ) {
      navigate(-1)
    }

    // Сбрасываем визуальный сдвиг
    if (cardRef.current) {
      cardRef.current.style.transform = ''
    }

    touchStartX.current = null
    touchEndX.current = null
    touchStartY.current = null
    touchEndY.current = null
  }

  // Показываем loading или ничего (редирект произойдет через useEffect)
  if (loading || !banner) {
    return null
  }

  return (
    <div
      className={`banner-details-root ${mounted ? 'is-mounted' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="banner-details-hero"
        style={{ backgroundImage: `url(${banner.image})` }}
      />

      <div className="banner-details-card" ref={cardRef}>
        <div className="banner-details-handle" />

        <div className="banner-details-title">{banner.title}</div>
        {banner.subtitle && (
          <div className="banner-details-sub">{banner.subtitle}</div>
        )}

        {banner.detailsImage && (
          <div className="banner-details-photo-wrap">
            <img
              src={banner.detailsImage}
              alt={`${banner.title} details`}
              className="banner-details-photo"
            />
          </div>
        )}

        <div
          className={`banner-details-desc-wrap ${
            expanded ? 'is-expanded' : ''
          }`}
        >
          <div className="banner-details-desc">{banner.description}</div>
        </div>

        <button
          className="banner-details-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Свернуть' : 'Подробнее'}
        </button>

        <button
          className="banner-details-back"
          onClick={() => navigate(-1)}
        >
          Назад
        </button>
      </div>
    </div>
  )
}
