import { useState, useEffect, useMemo, useRef } from 'react'
import { productsStore } from '../store/productsStore'
import type { Product, ProductStatus } from '../types/adminProduct'
import './ProductAdminSheet.css'

// Helper для безопасного trim
const safeTrim = (value: string | null | undefined): string => {
  return (value ?? '').trim()
}

type Props = {
  isOpen: boolean
  mode: 'create' | 'edit'
  productId?: string
  onClose: () => void
  onSaved?: () => void
  onDeleted?: () => void
}

export const ProductAdminSheet = ({ isOpen, mode, productId, onClose, onSaved, onDeleted }: Props) => {
  // ✅ ВСЕ хуки вызываются ВСЕГДА
  const [mounted, setMounted] = useState(false)
  const [article, setArticle] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [oldPrice, setOldPrice] = useState('')
  const [status, setStatus] = useState<ProductStatus>('draft')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showToast, setShowToast] = useState('')

  const product = useMemo(() => {
    if (mode === 'edit' && productId) {
      return productsStore.getById(productId)
    }
    return null
  }, [mode, productId])

  // Prefill form при edit
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
      
      if (mode === 'edit' && product) {
        setArticle(product.article ?? '')
        setTitle(product.title ?? '')
        setPrice(String(product.price ?? 0))
        setOldPrice(product.oldPrice ? String(product.oldPrice) : '')
        setStatus(product.status ?? 'draft')
        setDescription(product.description ?? '')
        setTagsInput(product.tags?.join(', ') ?? '')
        setImages([...(product.images ?? [])])
      } else {
        // Reset для create
        setArticle('')
        setTitle('')
        setPrice('')
        setOldPrice('')
        setStatus('draft')
        setDescription('')
        setTagsInput('')
        setImages([])
      }
      setErrors({})
      setNewImageUrl('')
      setShowDeleteConfirm(false)
    } else {
      setMounted(false)
    }
  }, [isOpen, mode, product])

  // ESC закрывает
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteConfirm) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, showDeleteConfirm])

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
      console.log('[scroll-lock] ProductAdminSheet', { isOpen, className: scroller.className })
    }

    return () => {
      scroller.classList.remove('scroll-lock')
    }
  }, [isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!safeTrim(article)) {
      newErrors.article = 'Артикул обязателен'
    }

    if (!safeTrim(title)) {
      newErrors.title = 'Название обязательно'
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Цена должна быть числом >= 0'
    }

    if (oldPrice) {
      const oldPriceNum = parseFloat(oldPrice)
      if (isNaN(oldPriceNum) || oldPriceNum < 0) {
        newErrors.oldPrice = 'Старая цена должна быть числом >= 0'
      }
    }

    if (images.length === 0) {
      newErrors.images = 'Добавьте хотя бы одно изображение'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const priceNum = parseFloat(price)
    const oldPriceNum = oldPrice ? parseFloat(oldPrice) : undefined
    const tags = safeTrim(tagsInput)
      .split(',')
      .map((t) => safeTrim(t))
      .filter((t) => t.length > 0)

    if (mode === 'create') {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        article: safeTrim(article),
        title: safeTrim(title),
        price: priceNum,
        oldPrice: oldPriceNum,
        description: safeTrim(description) || undefined,
        images: images.filter((url) => safeTrim(url).length > 0),
        tags: tags.length > 0 ? tags : undefined,
        status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      productsStore.addProduct(newProduct)
      setShowToast('Сохранено')
      setTimeout(() => {
        setShowToast('')
        onClose()
        onSaved?.()
      }, 1000)
    } else if (mode === 'edit' && productId) {
      productsStore.updateProduct(productId, {
        article: safeTrim(article),
        title: safeTrim(title),
        price: priceNum,
        oldPrice: oldPriceNum,
        description: safeTrim(description) || undefined,
        images: images.filter((url) => safeTrim(url).length > 0),
        tags: tags.length > 0 ? tags : undefined,
        status,
      })
      setShowToast('Сохранено')
      setTimeout(() => {
        setShowToast('')
        onClose()
        onSaved?.()
      }, 1000)
    }
  }

  const handleDelete = () => {
    if (mode === 'edit' && productId) {
      productsStore.deleteProduct(productId)
      setShowToast('Удалено')
      setTimeout(() => {
        setShowToast('')
        onClose()
        onDeleted?.()
      }, 1000)
    }
  }

  const handleAddImage = () => {
    const url = safeTrim(newImageUrl)
    if (!url) return

    // Простая валидация URL
    try {
      new URL(url)
      if (!images.includes(url)) {
        setImages([...images, url])
        setNewImageUrl('')
        setErrors({ ...errors, images: '' })
      }
    } catch {
      setErrors({ ...errors, images: 'Некорректный URL' })
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images]
    if (direction === 'up' && index > 0) {
      ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
    } else if (direction === 'down' && index < newImages.length - 1) {
      ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    }
    setImages(newImages)
  }

  if (!isOpen) return null

  const isValid = safeTrim(article) && safeTrim(title) && !isNaN(parseFloat(price)) && parseFloat(price) >= 0 && images.length > 0

  return (
    <div
      className={`tg-sheet-overlay ${mounted ? 'is-visible' : ''}`}
      onPointerDown={(e) => {
        if (!showDeleteConfirm && e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`tg-sheet product-admin-sheet ${mounted ? 'is-visible' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'Создать товар' : 'Редактировать товар'}
      >
        <div className="tg-handle" />
        <div className="tg-titlebar">
          <div className="tg-title">{mode === 'create' ? 'Новый товар' : 'Редактировать товар'}</div>
        </div>

        <div className="tg-sheet-body">
          {mode === 'edit' && !product ? (
            <div className="product-admin-error">Товар не найден</div>
          ) : (
            <>
              {/* Article */}
              <section className="tg-card">
                <div className="tg-card-title">Артикул *</div>
                <input
                  className="product-admin-input"
                  value={article}
                  onChange={(e) => {
                    setArticle(e.target.value)
                    setErrors({ ...errors, article: '' })
                  }}
                  placeholder="ASK-001-BLK"
                />
                {errors.article && <div className="product-admin-error">{errors.article}</div>}
              </section>

              {/* Title */}
              <section className="tg-card">
                <div className="tg-card-title">Название *</div>
                <input
                  className="product-admin-input"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setErrors({ ...errors, title: '' })
                  }}
                  placeholder="Название товара"
                />
                {errors.title && <div className="product-admin-error">{errors.title}</div>}
              </section>

              {/* Price */}
              <section className="tg-card">
                <div className="tg-card-title">Цена *</div>
                <input
                  type="number"
                  className="product-admin-input"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value)
                    setErrors({ ...errors, price: '' })
                  }}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.price && <div className="product-admin-error">{errors.price}</div>}
              </section>

              {/* Old Price */}
              <section className="tg-card">
                <div className="tg-card-title">Старая цена (опционально)</div>
                <input
                  type="number"
                  className="product-admin-input"
                  value={oldPrice}
                  onChange={(e) => {
                    setOldPrice(e.target.value)
                    setErrors({ ...errors, oldPrice: '' })
                  }}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.oldPrice && <div className="product-admin-error">{errors.oldPrice}</div>}
              </section>

              {/* Status */}
              <section className="tg-card">
                <div className="tg-card-title">Статус</div>
                <div className="product-admin-status">
                  <button
                    type="button"
                    className={`product-admin-status-btn ${status === 'draft' ? 'is-active' : ''}`}
                    onClick={() => setStatus('draft')}
                  >
                    Черновик
                  </button>
                  <button
                    type="button"
                    className={`product-admin-status-btn ${status === 'published' ? 'is-active' : ''}`}
                    onClick={() => setStatus('published')}
                  >
                    Опубликован
                  </button>
                </div>
              </section>

              {/* Description */}
              <section className="tg-card">
                <div className="tg-card-title">Описание</div>
                <textarea
                  className="product-admin-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Описание товара..."
                  rows={4}
                />
              </section>

              {/* Tags */}
              <section className="tg-card">
                <div className="tg-card-title">Теги (через запятую)</div>
                <input
                  className="product-admin-input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </section>

              {/* Images */}
              <section className="tg-card">
                <div className="tg-card-title">Изображения *</div>
                <div className="product-admin-images">
                  {images.map((url, idx) => (
                    <div key={idx} className="product-admin-image-item">
                      <img src={url} alt={`Preview ${idx + 1}`} onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }} />
                      <div className="product-admin-image-actions">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'up')}
                          disabled={idx === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'down')}
                          disabled={idx === images.length - 1}
                        >
                          ↓
                        </button>
                        <button type="button" onClick={() => handleRemoveImage(idx)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="product-admin-add-image">
                  <input
                    type="text"
                    className="product-admin-input"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddImage()
                      }
                    }}
                    placeholder="URL изображения"
                  />
                  <button type="button" className="tg-btn tg-btn-primary" onClick={handleAddImage}>
                    Добавить
                  </button>
                </div>
                {errors.images && <div className="product-admin-error">{errors.images}</div>}
              </section>

              {/* Actions */}
              <section className="tg-card">
                <div className="tg-actions">
                  <button
                    className="tg-btn tg-btn-primary"
                    onClick={handleSave}
                    disabled={!isValid}
                  >
                    Сохранить
                  </button>
                  {mode === 'edit' && (
                    <button
                      className="tg-btn tg-btn-danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Удалить
                    </button>
                  )}
                  <button className="tg-btn tg-btn-ghost" onClick={onClose}>
                    Отмена
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="product-admin-delete-confirm">
          <div className="product-admin-delete-content">
            <div className="product-admin-delete-title">Удалить товар?</div>
            <div className="product-admin-delete-text">Это действие нельзя отменить.</div>
            <div className="tg-actions">
              <button className="tg-btn tg-btn-danger" onClick={handleDelete}>
                Да, удалить
              </button>
              <button className="tg-btn tg-btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="product-admin-toast">{showToast}</div>
      )}
    </div>
  )
}

