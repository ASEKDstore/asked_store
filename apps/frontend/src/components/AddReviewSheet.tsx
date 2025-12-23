import { useState, useRef, useEffect } from 'react'
import { getUIProducts, type UIProduct } from '../api/productsApi'
import { StarRating } from './StarRating'
import type { ReviewFormData, ReviewMedia } from '../types/review'
import './add-review-sheet.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ReviewFormData) => void
}

const EMOJI_PICKS = ['🔥', '💎', '🖤', '😮‍💨', '😍', '😡', '✅']

export const AddReviewSheet = ({ isOpen, onClose, onSubmit }: Props) => {
  const [mounted, setMounted] = useState(false)
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [text, setText] = useState('')
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<ReviewMedia[]>([])
  const [productId, setProductId] = useState<string>('')
  const [products, setProducts] = useState<UIProduct[]>([])
  const [errors, setErrors] = useState<{ rating?: string; text?: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaPreviewsRef = useRef<ReviewMedia[]>([])

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prods = await getUIProducts()
        setProducts(prods)
      } catch (error) {
        console.error('Failed to load products for review:', error)
      }
    }
    if (isOpen) {
      loadProducts()
    }
  }, [isOpen])

  // Синхронизируем ref с state
  useEffect(() => {
    mediaPreviewsRef.current = mediaPreviews
  }, [mediaPreviews])

  // Cleanup objectURL при размонтировании
  useEffect(() => {
    return () => {
      // Cleanup при размонтировании компонента
      mediaPreviewsRef.current.forEach((m) => {
        try {
          URL.revokeObjectURL(m.url)
        } catch {
          // Ignore errors
        }
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
      // Reset form
      setRating(null)
      setText('')
      setSelectedEmojis([])
      // Cleanup previews before reset
      setMediaPreviews((prev) => {
        prev.forEach((m) => {
          try {
            URL.revokeObjectURL(m.url)
          } catch {
            // Ignore errors
          }
        })
        return []
      })
      setMediaFiles([])
      setProductId('')
      setErrors({})
    }
  }, [isOpen])

  // ESC закрывает
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

  // Блокировка скролла при открытом sheet (foundation: используем .app-content или .app-scroll для совместимости)
  useEffect(() => {
    const scroller = document.querySelector('.app-content') || document.querySelector('.app-scroll') as HTMLElement | null
    if (!scroller) return

    if (isOpen) {
      scroller.classList.add('scroll-lock')
    } else {
      scroller.classList.remove('scroll-lock')
    }

    // Диагностика в dev
    if (import.meta.env.DEV) {
      console.log('[scroll-lock] AddReviewSheet', { isOpen, className: scroller.className })
    }

    return () => {
      scroller.classList.remove('scroll-lock')
    }
  }, [isOpen])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const next: ReviewMedia[] = files.slice(0, 6).map((file) => {
      const url = URL.createObjectURL(file)
      const isVideo = file.type.startsWith('video/')
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
        type: isVideo ? 'video' : 'image',
        url,
      }
    })

    setMediaPreviews((prev) => {
      const merged = [...prev, ...next]
      return merged.slice(0, 6)
    })

    setMediaFiles((prev) => {
      const merged = [...prev, ...files.slice(0, 6)]
      return merged.slice(0, 6)
    })

    // Reset input чтобы повторный выбор того же файла триггерил change
    e.target.value = ''
  }

  const handleRemoveMedia = (id: string) => {
    setMediaPreviews((prev) => {
      const item = prev.find((m) => m.id === id)
      if (item) {
        try {
          URL.revokeObjectURL(item.url)
        } catch {
          // Ignore errors
        }
      }
      return prev.filter((m) => m.id !== id)
    })

    setMediaFiles((prev) => {
      // Удаляем файл по индексу в mediaPreviews
      const previewIndex = mediaPreviews.findIndex((m) => m.id === id)
      if (previewIndex >= 0) {
        return prev.filter((_, i) => i !== previewIndex)
      }
      return prev
    })
  }

  const toggleEmoji = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis(selectedEmojis.filter((e) => e !== emoji))
    } else {
      setSelectedEmojis([...selectedEmojis, emoji])
    }
  }

  const handleSubmit = () => {
    const newErrors: { rating?: string; text?: string } = {}

    if (!rating) {
      newErrors.rating = 'Выберите оценку'
    }

    if (text.trim().length < 10 && mediaFiles.length === 0) {
      newErrors.text = 'Минимум 10 символов или прикрепите фото/видео'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      rating: rating!,
      text: text.trim(),
      emojis: selectedEmojis,
      media: mediaFiles,
      productId: productId || undefined,
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className={`tg-sheet-overlay ${mounted ? 'is-visible' : ''}`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`tg-sheet add-review-sheet ${mounted ? 'is-visible' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Оставить отзыв"
      >
        <div className="tg-handle" />
        <div className="tg-titlebar">
          <div className="tg-title">Оставить отзыв</div>
        </div>

        <div className="tg-sheet-body">
          {/* Рейтинг */}
          <section className="tg-card">
            <div className="tg-card-title">Оценка</div>
            <div className="add-review-rating">
              <StarRating
                rating={rating || 0}
                onChange={(r) => {
                  setRating(r)
                  setErrors({ ...errors, rating: undefined })
                }}
                size="large"
              />
              {errors.rating && (
                <div className="add-review-error">{errors.rating}</div>
              )}
            </div>
          </section>

          {/* Текст */}
          <section className="tg-card">
            <div className="tg-card-title">Текст отзыва</div>
            <textarea
              className="add-review-textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setErrors({ ...errors, text: undefined })
              }}
              placeholder="Расскажите о вашем опыте..."
              rows={5}
              maxLength={500}
            />
            <div className="add-review-counter">
              {text.length} / 500
            </div>
            {errors.text && (
              <div className="add-review-error">{errors.text}</div>
            )}
          </section>

          {/* Эмодзи */}
          <section className="tg-card">
            <div className="tg-card-title">Эмодзи</div>
            <div className="add-review-emojis">
              {EMOJI_PICKS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`add-review-emoji-btn ${
                    selectedEmojis.includes(emoji) ? 'is-selected' : ''
                  }`}
                  onClick={() => toggleEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {selectedEmojis.length > 0 && (
              <div className="add-review-selected-emojis">
                Выбрано: {selectedEmojis.join(' ')}
              </div>
            )}
          </section>

          {/* Медиа */}
          <section className="tg-card">
            <div className="tg-card-title">Фото / Видео</div>
            <div className="add-review-media">
              {mediaPreviews.length > 0 && (
                <div className="add-review-media-grid">
                  {mediaPreviews.map((preview) => (
                    <div key={preview.id} className="add-review-media-item">
                      {preview.type === 'image' ? (
                        <img src={preview.url} alt="Preview" />
                      ) : (
                        <div className="add-review-media-video">
                          <video src={preview.url} muted />
                          <div className="add-review-media-play">▶</div>
                        </div>
                      )}
                      <button
                        type="button"
                        className="add-review-media-remove"
                        onClick={() => handleRemoveMedia(preview.id)}
                        aria-label="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {mediaFiles.length < 6 && (
                <button
                  type="button"
                  className="add-review-media-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Добавить фото/видео ({mediaFiles.length}/6)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </section>

          {/* Товар (опционально) */}
          <section className="tg-card">
            <div className="tg-card-title">Отзыв о товаре (опционально)</div>
            <select
              className="add-review-product-select"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Без привязки к товару</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.article})
                </option>
              ))}
            </select>
          </section>

          {/* Действия */}
          <section className="tg-card">
            <div className="tg-actions">
              <button className="tg-btn tg-btn-primary" onClick={handleSubmit}>
                Опубликовать
              </button>
              <button className="tg-btn tg-btn-ghost" onClick={onClose}>
                Отмена
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

