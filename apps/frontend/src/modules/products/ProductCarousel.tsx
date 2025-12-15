import { useState, useRef } from 'react'
import { products } from '../../data/products'
import { useProductSheet } from '../../context/ProductSheetContext'
import './product-carousel.css'

export const ProductCarousel = () => {
  const { openProduct } = useProductSheet()
  const [active, setActive] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef<number | null>(null)

  const prev = () =>
    setActive((i) => (i - 1 + products.length) % products.length)

  const next = () =>
    setActive((i) => (i + 1) % products.length)

  const getIndex = (offset: number) =>
    (active + offset + products.length) % products.length

  // Свайп на мобильных
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
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
        next() // Свайп влево - следующий
      } else {
        prev() // Свайп вправо - предыдущий
      }
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  // Drag на десктопе
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || dragStartX.current === null) return
    // Визуальная обратная связь может быть добавлена здесь
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || dragStartX.current === null) return

    const diff = dragStartX.current - e.clientX
    const minDragDistance = 50

    if (Math.abs(diff) > minDragDistance) {
      if (diff > 0) {
        next() // Drag влево - следующий
      } else {
        prev() // Drag вправо - предыдущий
      }
    }

    isDragging.current = false
    dragStartX.current = null
  }

  const items = [
    { product: products[getIndex(-1)], pos: 'left' },
    { product: products[getIndex(0)], pos: 'center' },
    { product: products[getIndex(1)], pos: 'right' },
  ]

  return (
    <section className="product-carousel">
      <div
        className="product-carousel-stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {items.map(({ product, pos }) => (
          <div
            key={`${product.id}-${pos}`}
            className={`product-card ${pos}`}
            onClick={
              pos === 'center'
                ? () => openProduct(product.id)
                : undefined
            }
            role={pos === 'center' ? 'button' : undefined}
            tabIndex={pos === 'center' ? 0 : undefined}
            onKeyDown={
              pos === 'center'
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openProduct(product.id)
                    }
                  }
                : undefined
            }
          >
            <div
              className="product-image"
              style={{ backgroundImage: `url(${product.image})` }}
            />

            <div className="product-info">
              <div className="product-article">{product.article}</div>

              <div className="product-title">{product.title}</div>

              <div className="product-price">
                {product.price.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="product-carousel-controls">
        <button onClick={prev} aria-label="Предыдущий товар">
          ←
        </button>
        <button onClick={next} aria-label="Следующий товар">
          →
        </button>
      </div>
    </section>
  )
}

