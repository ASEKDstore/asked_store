import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { products } from '../../data/products'
import { useCart } from '../../context/CartContext'
import { flyToCart } from '../../utils/flyToCart'
import { ProductGallery } from '../ProductGallery'
import { useProductSheet } from '../../context/ProductSheetContext'
import './product-sheet.css'

type ProductSheetProps = {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export const ProductSheet: React.FC<ProductSheetProps> = ({ productId, isOpen, onClose }) => {
  // ✅ ВСЕ хуки вызываются ВСЕГДА, до любого return
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { openProduct } = useProductSheet()
  
  const [mounted, setMounted] = useState(false)
  const [size, setSize] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  // Находим продукт (не хук, но вычисляем после хуков)
  const product = productId ? products.find((p) => p.id === productId) : null

  // ✅ useMemo вызывается ВСЕГДА, даже если product null
  // Собираем массив изображений для галереи
  const gallery = useMemo(() => {
    if (!product) return []
    if (product.images?.length) {
      return product.images
    }
    if (product.image) {
      return [product.image]
    }
    return []
  }, [product])

  // ✅ useMemo вызывается ВСЕГДА, даже если product null
  // Похожие товары (по категории или тегам)
  const relatedProducts = useMemo(() => {
    if (!product || !productId) return []
    
    const related = products
      .filter((p) => {
        if (p.id === productId) return false
        // По категории
        if (p.category === product.category) return true
        // По тегам (хотя бы один общий)
        if (product.tags && p.tags) {
          return product.tags.some((tag) => p.tags.includes(tag))
        }
        return false
      })
      .slice(0, 8) // Максимум 8 товаров
    
    return related
  }, [product, productId])

  // ✅ useEffect вызывается ВСЕГДА
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
    }
  }, [isOpen])

  // ✅ useEffect вызывается ВСЕГДА
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // ✅ useEffect вызывается ВСЕГДА
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // ✅ useEffect вызывается ВСЕГДА
  // Блокировка скролла при открытом sheet (только .app-scroll, не body)
  useEffect(() => {
    const scroller = document.querySelector('.app-scroll') as HTMLElement | null
    if (!scroller) return

    if (isOpen) {
      scroller.classList.add('scroll-lock')
    } else {
      scroller.classList.remove('scroll-lock')
    }

    // Диагностика в dev
    if (import.meta.env.DEV) {
      console.log('[scroll-lock] ProductSheet', { isOpen, className: scroller.className })
    }

    return () => {
      scroller.classList.remove('scroll-lock')
    }
  }, [isOpen])

  // Обработчики событий (не хуки, можно после хуков)
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!product) return

    if (!size) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 2000)
      return
    }

    addItem(product, { size })
    setShowToast(true)
    flyToCart({ imageUrl: product.image, fromEl: e.currentTarget })
  }

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!product) return

    if (!size) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 2000)
      return
    }

    addItem(product, { size })
    flyToCart({ imageUrl: product.image, fromEl: e.currentTarget })
    setTimeout(() => {
      onClose()
      navigate('/app/cart')
    }, 300)
  }

  // Вычисляем shouldShow (не хук)
  const shouldShow = product && productId && isOpen

  // ✅ Только ПОСЛЕ всех хуков можно делать ранний return
  if (!product || !productId) {
    // Если нет продукта - рендерим пустой overlay (скрыт)
    return (
      <div
        className={`tg-sheet-overlay ${false ? 'is-visible' : ''}`}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={`tg-sheet-overlay ${shouldShow && mounted ? 'is-visible' : ''}`}
      onPointerDown={(e) => {
        if (shouldShow && e.target === e.currentTarget) {
          onClose()
        }
      }}
      aria-hidden={!shouldShow}
    >
      <div
        className={`tg-sheet ${shouldShow && mounted ? 'is-visible' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal={shouldShow ? 'true' : 'false'}
        aria-label="Информация о товаре"
        aria-hidden={!shouldShow}
      >
        <div className="tg-handle" />
        <div className="tg-titlebar">
          <div className="tg-title">Товар</div>
        </div>

        <div className="tg-sheet-body">
          {/* Медиа */}
          <div className="tg-media" data-product-hero>
            <ProductGallery images={gallery} alt={product.title} />
          </div>

          {/* Header товара */}
          <div className="tg-profile-head">
            <div className="tg-hero-title">{product.title}</div>
            <div className="tg-hero-sub">@{product.article}</div>
            <div className="tg-price-row">
              <div className="tg-price">{product.price.toLocaleString('ru-RU')} ₽</div>
              {product.oldPrice && product.oldPrice > product.price && (
                <div className="tg-oldprice">{product.oldPrice.toLocaleString('ru-RU')} ₽</div>
              )}
            </div>
          </div>

          {/* Секция: Данные */}
          <section className="tg-card">
            <div className="tg-card-title">Данные</div>
            <div className="tg-row">
              <div className="tg-row-key">Артикул</div>
              <div className="tg-row-val">{product.article}</div>
            </div>
            <div className="tg-row">
              <div className="tg-row-key">В наличии</div>
              <div className="tg-row-val">{product.available ? 'Да' : 'Нет'}</div>
            </div>
            <div className="tg-row">
              <div className="tg-row-key">Категория</div>
              <div className="tg-row-val">{product.category}</div>
            </div>
          </section>

          {/* Секция: Размеры */}
          <section className="tg-card">
            <div className="tg-card-title">Размер</div>
            <div className="tg-sizes">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className={`tg-size-pill ${size === s ? 'is-active' : ''} ${
                    sizeError ? 'is-error' : ''
                  }`}
                  onClick={() => {
                    setSize(s)
                    setSizeError(false)
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizeError && (
              <div className="tg-size-error">Пожалуйста, выберите размер</div>
            )}
          </section>

          {/* Секция: Действия */}
          <section className="tg-card">
            <div className="tg-actions">
              <button className="tg-btn tg-btn-primary" onClick={handleBuyNow}>
                Купить сейчас
              </button>
              <button className="tg-btn tg-btn-secondary" onClick={handleAddToCart}>
                В корзину
              </button>
              <button className="tg-btn tg-btn-ghost" onClick={onClose}>
                Назад
              </button>
            </div>
          </section>

          {/* Секция: Описание */}
          <section className="tg-card">
            <div className="tg-card-title">Описание</div>
            <div className="tg-text">{product.description}</div>
          </section>

          {/* Секция: Похожие товары */}
          {relatedProducts.length > 0 && (
            <section className="tg-card">
              <div className="tg-card-title">Похожие товары</div>
              <div className="related-row">
                {relatedProducts.map((p) => {
                  const relatedImage = p.images?.[0] || p.image || '/assets/placeholder-product.jpg'
                  return (
                    <button
                      key={p.id}
                      className="related-card"
                      type="button"
                      onClick={() => openProduct(p.id)}
                    >
                      <div className="related-img">
                        <img src={relatedImage} alt={p.title} />
                      </div>
                      <div className="related-meta">
                        <div className="related-title">{p.title}</div>
                        <div className="related-price">{p.price.toLocaleString('ru-RU')} ₽</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {showToast && (
        <div className="tg-toast">Добавлено в корзину ✅</div>
      )}
    </div>
  )
}

