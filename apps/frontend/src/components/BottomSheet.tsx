import { useEffect, useRef, useState } from 'react'
import './bottom-sheet.css'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    // Блокировка скролла только у .app-scroll, не body (для стабильности в Telegram)
    const scroller = document.querySelector('.app-scroll') as HTMLElement | null
    
    if (open) {
      if (scroller) {
        scroller.classList.add('scroll-lock')
      }
      // Trigger animation
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
      if (scroller) {
        scroller.classList.remove('scroll-lock')
      }
    }

    // Диагностика в dev
    if (import.meta.env.DEV) {
      console.log('[scroll-lock] BottomSheet', { open, className: scroller?.className })
    }

    return () => {
      if (scroller) {
        scroller.classList.remove('scroll-lock')
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sheetRef.current) return
    startYRef.current = e.touches[0].clientY
    currentYRef.current = startYRef.current
    isDraggingRef.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return
    
    currentYRef.current = e.touches[0].clientY
    const dy = currentYRef.current - startYRef.current
    
    // Only allow dragging down
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || !sheetRef.current) return
    
    const dy = currentYRef.current - startYRef.current
    
    // If dragged down more than 90px, close
    if (dy > 90) {
      onClose()
    } else {
      // Snap back
      sheetRef.current.style.transform = ''
    }
    
    isDraggingRef.current = false
  }

  if (!open) return null

  return (
    <div 
      className={`bottom-sheet-overlay ${isVisible ? 'is-visible' : ''}`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isVisible ? 'is-visible' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bottom-sheet-handle" />
        {title && (
          <div className="bottom-sheet-header">
            <h2 className="bottom-sheet-title">{title}</h2>
          </div>
        )}
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  )
}

