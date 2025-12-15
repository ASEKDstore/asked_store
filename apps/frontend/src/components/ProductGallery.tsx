import { useState, useRef, useEffect } from 'react'
import './product-gallery.css'
import { FullscreenGallery } from './FullscreenGallery'

type Props = {
  images: string[]
  alt?: string
  imageFocusY?: number // 0..100, опциональный override для позиции по Y
}

type ImgMeta = { w: number; h: number; portrait: boolean }

export const ProductGallery = ({ images, alt = 'Product', imageFocusY }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [meta, setMeta] = useState<Record<string, ImgMeta>>({})
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Сброс индекса при изменении images
  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  // Умный фокус: определяем ориентацию изображений
  useEffect(() => {
    images.forEach((src) => {
      if (meta[src]) return

      const img = new Image()
      img.onload = () => {
        const w = img.naturalWidth || 1
        const h = img.naturalHeight || 1
        setMeta((m) => ({ ...m, [src]: { w, h, portrait: h > w } }))
      }
      img.onerror = () => {
        // Fallback если не загрузилось
        setMeta((m) => ({ ...m, [src]: { w: 1, h: 1, portrait: false } }))
      }
      img.src = src
    })
  }, [images, meta])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return

    const dx = touchStartX.current - touchEndX.current

    if (dx > 45) {
      // Свайп влево → следующий
      next()
    } else if (dx < -45) {
      // Свайп вправо → предыдущий
      prev()
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  const prev = () => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length)
  }

  const next = () => {
    setActiveIndex((i) => (i + 1) % images.length)
  }

  if (images.length === 0) {
    return (
      <div className="pg-root">
        <div className="pg-placeholder">
          <div className="pg-placeholder-icon">📷</div>
          <div className="pg-placeholder-text">Нет изображения</div>
        </div>
      </div>
    )
  }

  const showNav = images.length > 1
  const showDots = images.length > 1

  return (
    <div className="pg-root">
      <div
        className="pg-track"
        style={{ ['--idx' as any]: activeIndex } as React.CSSProperties}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, idx) => {
          const isPortrait = meta[img]?.portrait
          // Умный фокус: портретные фото смещаем выше, горизонтальные по центру
          const focusY = imageFocusY !== undefined ? `${imageFocusY}%` : isPortrait ? '30%' : '50%'
          const focus = `50% ${focusY}`

          return (
            <div key={idx} className="pg-slide">
              {/* Размытый фон из того же изображения */}
              <img
                src={img}
                alt=""
                aria-hidden="true"
                className="pg-bg"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Основное изображение (contain) с умным фокусом */}
              <img
                src={img}
                alt={`${alt} ${idx + 1}`}
                className="pg-img product-hero-img"
                style={{ objectPosition: focus }}
                loading={idx === 0 ? 'eager' : 'lazy'}
                onClick={() => setIsFullscreenOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsFullscreenOpen(true)
                  }
                }}
                aria-label="Открыть фото на весь экран"
              />
            </div>
          )
        })}
      </div>

      {showNav && (
        <>
          <button
            className="pg-nav pg-prev"
            onClick={prev}
            aria-label="Предыдущее фото"
            type="button"
          >
            ←
          </button>
          <button
            className="pg-nav pg-next"
            onClick={next}
            aria-label="Следующее фото"
            type="button"
          >
            →
          </button>
        </>
      )}

      {showDots && (
        <div className="pg-dots">
          {images.map((_, idx) => (
            <button
              key={idx}
              className={`pg-dot ${idx === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Перейти к фото ${idx + 1}`}
              type="button"
            />
          ))}
        </div>
      )}

      <FullscreenGallery
        images={images}
        startIndex={activeIndex}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </div>
  )
}

