import { useState, useRef } from 'react'
import './product-showcase-carousel.css'

export type Product = {
  id: string
  title: string
  article?: string
  price: number
  image?: string
  images?: string[]
}

type Props = {
  products: Product[]
  onOpen: (id: string) => void
}

export const ProductShowcaseCarousel = ({ products, onOpen }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  if (products.length === 0) {
    return null
  }

  const n = products.length

  const prev = () => {
    setActiveIndex((i) => (i - 1 + n) % n)
  }

  const next = () => {
    setActiveIndex((i) => (i + 1) % n)
  }

  // Свайп
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const dx = touchStartX.current - touchEndX.current

    if (dx > 45) {
      next() // Свайп влево - следующий
    } else if (dx < -45) {
      prev() // Свайп вправо - предыдущий
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  const getPositionClass = (idx: number): string => {
    if (n < 3) {
      return 'is-center'
    }

    const prevIndex = (activeIndex - 1 + n) % n
    const nextIndex = (activeIndex + 1) % n

    if (idx === activeIndex) return 'is-center'
    if (idx === prevIndex) return 'is-left'
    if (idx === nextIndex) return 'is-right'
    return 'is-hidden'
  }

  const getImageUrl = (product: Product): string => {
    return product.image || product.images?.[0] || '/assets/product-1.jpg'
  }

  return (
    <div className="showcase-carousel">
      <div
        className="car-stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {products.map((product, idx) => {
          const positionClass = getPositionClass(idx)
          const isClickable = positionClass === 'is-center' || positionClass === 'is-left' || positionClass === 'is-right'

          return (
            <div
              key={product.id}
              className={`car-card ${positionClass}`}
              onClick={isClickable ? () => onOpen(product.id) : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpen(product.id)
                      }
                    }
                  : undefined
              }
            >
              <div className="car-card-image">
                <img src={getImageUrl(product)} alt={product.title} />
              </div>
              <div className="car-card-info">
                <div className="car-card-title">{product.title}</div>
                {product.article && (
                  <div className="car-card-article">ART: {product.article}</div>
                )}
                <div className="car-card-price">
                  {product.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {n >= 3 && (
        <>
          <button
            className="car-nav car-nav-prev"
            onClick={prev}
            aria-label="Предыдущий товар"
            type="button"
          >
            ←
          </button>
          <button
            className="car-nav car-nav-next"
            onClick={next}
            aria-label="Следующий товар"
            type="button"
          >
            →
          </button>
        </>
      )}

      {n > 1 && (
        <div className="car-dots">
          {products.slice(0, Math.min(n, 6)).map((_, idx) => (
            <button
              key={idx}
              className={`car-dot ${idx === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Перейти к товару ${idx + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  )
}



