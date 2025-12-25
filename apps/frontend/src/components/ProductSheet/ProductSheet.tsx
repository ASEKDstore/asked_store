import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUIProduct, getUIProducts, type UIProduct } from '../../api/productsApi'
import { useCart } from '../../context/CartContext'
import { flyToCart } from '../../utils/flyToCart'
import { ProductGallery } from '../ProductGallery'
import { useProductSheet } from '../../context/ProductSheetContext'
import { ModalPortal } from '../ModalPortal'
import { pushLayer, popLayer } from '../../shared/layerManager'
import './product-sheet.css'

type ProductSheetProps = {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export const ProductSheet: React.FC<ProductSheetProps> = ({ productId, isOpen, onClose }) => {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { openProduct } = useProductSheet()
  
  const [mounted, setMounted] = useState(false)
  const [size, setSize] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [product, setProduct] = useState<UIProduct | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<UIProduct[]>([])
  const [loading, setLoading] = useState(false)

  // Load product from API with abort controller
  useEffect(() => {
    if (!productId || !isOpen) {
      setProduct(null)
      setRelatedProducts([])
      setLoading(false)
      setMounted(false)
      return
    }

    const abortController = new AbortController()
    setMounted(false)
    setLoading(true)

    const loadProduct = async () => {
      try {
        const loadedProduct = await getUIProduct(productId)
        
        if (!abortController.signal.aborted) {
          setProduct(loadedProduct)
          
          // Load related products (same category)
          if (loadedProduct) {
            const related = await getUIProducts({
              categorySlug: loadedProduct.category,
              inStock: true,
            })
            // Filter out current product and limit to 8
            if (!abortController.signal.aborted) {
              const filtered = related
                .filter(p => p.id !== productId)
                .slice(0, 8)
              setRelatedProducts(filtered)
            }
          }
          
          // Показываем контент после загрузки продукта
          if (!abortController.signal.aborted) {
            setLoading(false)
            // Используем setTimeout для плавного появления
            setTimeout(() => {
              if (!abortController.signal.aborted) {
                setMounted(true)
              }
            }, 50)
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Failed to load product:', error)
          setProduct(null)
          setRelatedProducts([])
          setLoading(false)
          setMounted(false)
        }
      }
    }

    loadProduct()
    
    return () => {
      abortController.abort()
    }
  }, [productId, isOpen])

  // Reset size when product changes
  useEffect(() => {
    setSize(null)
    setSizeError(false)
  }, [productId])

  // Toast timer
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // ESC handler
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

  // Layer management
  useEffect(() => {
    if (isOpen && productId) {
      pushLayer('ProductSheet')
    } else {
      popLayer('ProductSheet')
    }
    return () => {
      popLayer('ProductSheet')
    }
  }, [isOpen, productId])

  // Gallery images
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

  // Не рендерим ничего если не открыт или нет productId
  if (!isOpen || !productId) return null

  // Sheet всегда показывается когда открыт, но контент виден только после загрузки
  const isReady = mounted && product && !loading

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="product-sheet-overlay is-visible"
        onClick={onClose}
        aria-hidden={false}
      />
      <div
        className={`product-sheet ${isOpen ? 'is-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal={isReady ? 'true' : 'false'}
        aria-label="Информация о товаре"
        aria-hidden={false}
      >
        {loading ? (
          <div className="product-sheet-loading">
            <div className="product-sheet-loading-spinner">Загрузка...</div>
          </div>
        ) : product ? (
          <>
            <div className="product-sheet-handle" />
            <div className="product-sheet-header">
              <div className="product-sheet-title">Товар</div>
            </div>

            <div className="product-sheet-body">
              {/* Медиа */}
              <div className="product-sheet-media">
                <ProductGallery images={gallery} alt={product.title} />
              </div>

              {/* Header товара */}
              <div className="product-sheet-hero">
                <div className="product-sheet-hero-title">{product.title}</div>
                <div className="product-sheet-hero-sub">@{product.article}</div>
                <div className="product-sheet-price-row">
                  <div className="product-sheet-price">{product.price.toLocaleString('ru-RU')} ₽</div>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <div className="product-sheet-oldprice">{product.oldPrice.toLocaleString('ru-RU')} ₽</div>
                  )}
                </div>
              </div>

              {/* Секция: Данные */}
              <section className="product-sheet-card">
                <div className="product-sheet-card-title">Данные</div>
                <div className="product-sheet-row">
                  <div className="product-sheet-row-key">Артикул</div>
                  <div className="product-sheet-row-val">{product.article}</div>
                </div>
                <div className="product-sheet-row">
                  <div className="product-sheet-row-key">В наличии</div>
                  <div className="product-sheet-row-val">{product.available ? 'Да' : 'Нет'}</div>
                </div>
                <div className="product-sheet-row">
                  <div className="product-sheet-row-key">Категория</div>
                  <div className="product-sheet-row-val">{product.category}</div>
                </div>
              </section>

              {/* Секция: Размеры */}
              <section className="product-sheet-card">
                <div className="product-sheet-card-title">Размер</div>
                <div className="product-sheet-sizes">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      className={`product-sheet-size-pill ${size === s ? 'is-active' : ''} ${
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
                  <div className="product-sheet-size-error">Пожалуйста, выберите размер</div>
                )}
              </section>

              {/* Секция: Действия */}
              <section className="product-sheet-card">
                <div className="product-sheet-actions">
                  <button className="product-sheet-btn product-sheet-btn-primary" onClick={handleBuyNow}>
                    Купить сейчас
                  </button>
                  <button className="product-sheet-btn product-sheet-btn-secondary" onClick={handleAddToCart}>
                    В корзину
                  </button>
                  <button className="product-sheet-btn product-sheet-btn-ghost" onClick={onClose}>
                    Назад
                  </button>
                </div>
              </section>

              {/* Секция: Описание */}
              {product.description && (
                <section className="product-sheet-card">
                  <div className="product-sheet-card-title">Описание</div>
                  <div className="product-sheet-text">{product.description}</div>
                </section>
              )}

              {/* Секция: Похожие товары */}
              {relatedProducts.length > 0 && (
                <section className="product-sheet-card">
                  <div className="product-sheet-card-title">Похожие товары</div>
                  <div className="product-sheet-related">
                    {relatedProducts.map((p) => {
                      const relatedImage = p.images?.[0] || p.image || '/assets/placeholder-product.jpg'
                      return (
                        <button
                          key={p.id}
                          className="product-sheet-related-card"
                          type="button"
                          onClick={() => {
                            if (p?.id) {
                              openProduct(p.id)
                            }
                          }}
                        >
                          <div className="product-sheet-related-img">
                            <img src={relatedImage} alt={p.title} />
                          </div>
                          <div className="product-sheet-related-meta">
                            <div className="product-sheet-related-title">{p.title}</div>
                            <div className="product-sheet-related-price">{p.price.toLocaleString('ru-RU')} ₽</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          <div className="product-sheet-loading">
            <div className="product-sheet-loading-spinner">Ошибка загрузки</div>
          </div>
        )}

        {showToast && (
          <div className="product-sheet-toast">Добавлено в корзину ✅</div>
        )}
      </div>
    </ModalPortal>
  )
}
