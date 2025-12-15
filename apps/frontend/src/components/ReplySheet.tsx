import { useState, useEffect } from 'react'
import './reply-sheet.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (text: string, isAdmin: boolean) => void
  isAdmin?: boolean
  reviewAuthorName?: string
}

export const ReplySheet = ({ isOpen, onClose, onSubmit, isAdmin = false, reviewAuthorName }: Props) => {
  const [mounted, setMounted] = useState(false)
  const [text, setText] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
      setText('')
      setAsAdmin(false)
    } else {
      setMounted(false)
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
      console.log('[scroll-lock] ReplySheet', { isOpen, className: scroller.className })
    }

    return () => {
      scroller.classList.remove('scroll-lock')
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (text.trim().length < 3) return
    onSubmit(text.trim(), asAdmin && isAdmin)
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
        className={`tg-sheet reply-sheet ${mounted ? 'is-visible' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ответить на отзыв"
      >
        <div className="tg-handle" />
        <div className="tg-titlebar">
          <div className="tg-title">Ответить</div>
        </div>

        <div className="tg-sheet-body">
          {reviewAuthorName && (
            <div className="reply-sheet-context">
              Ответ на отзыв от <strong>{reviewAuthorName}</strong>
            </div>
          )}

          <section className="tg-card">
            <div className="tg-card-title">Текст ответа</div>
            <textarea
              className="reply-sheet-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишите ответ..."
              rows={5}
              maxLength={500}
              autoFocus
            />
            <div className="reply-sheet-counter">
              {text.length} / 500
            </div>
          </section>

          {isAdmin && (
            <section className="tg-card">
              <label className="reply-sheet-checkbox">
                <input
                  type="checkbox"
                  checked={asAdmin}
                  onChange={(e) => setAsAdmin(e.target.checked)}
                />
                <span>Ответ от ASKED</span>
              </label>
            </section>
          )}

          <section className="tg-card">
            <div className="tg-actions">
              <button
                className="tg-btn tg-btn-primary"
                onClick={handleSubmit}
                disabled={text.trim().length < 3}
              >
                Отправить
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

