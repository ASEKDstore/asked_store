import { useState, useEffect, useRef } from 'react'
import './fullscreen-gallery.css'

type Props = {
  images: string[]
  startIndex: number
  isOpen: boolean
  onClose: () => void
}

export const FullscreenGallery = ({ images, startIndex, isOpen, onClose }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDraggingClose, setIsDraggingClose] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const lastTapTimeRef = useRef<number>(0)
  const panStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  
  // Drag-to-close refs
  const startYRef = useRef<number>(0)
  const startXRef = useRef<number>(0)
  const lastYRef = useRef<number>(0)
  const lastTRef = useRef<number>(0)
  const velYRef = useRef<number>(0)
  
  // Inertial pan refs
  const velRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  // Rubber function для pan
  const rubber = (val: number, min: number, max: number): number => {
    if (val < min) return min + (val - min) * 0.35
    if (val > max) return max + (val - max) * 0.35
    return val
  }

  // Clamp function
  const clamp = (val: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, val))
  }

  // Inertial pan animation
  const runInertia = () => {
    if (zoom <= 1 || isDraggingClose) {
      rafRef.current = null
      setIsPanning(false)
      return
    }

    const maxPan = (zoom - 1) * 160
    let { x, y } = pan
    let { x: vx, y: vy } = velRef.current

    // Apply velocity
    x += vx * 16
    y += vy * 16

    // Apply rubber
    x = rubber(x, -maxPan, maxPan)
    y = rubber(y, -maxPan, maxPan)

    // Decay velocity
    vx *= 0.92
    vy *= 0.92

    // Spring back to bounds if outside
    if (x < -maxPan || x > maxPan) {
      x = x + (clamp(x, -maxPan, maxPan) - x) * 0.14
    }
    if (y < -maxPan || y > maxPan) {
      y = y + (clamp(y, -maxPan, maxPan) - y) * 0.14
    }

    setPan({ x, y })
    velRef.current = { x: vx, y: vy }

    // Stop if velocity is too low
    if (Math.abs(vx) + Math.abs(vy) < 0.02) {
      // Final spring back
      const finalX = clamp(x, -maxPan, maxPan)
      const finalY = clamp(y, -maxPan, maxPan)
      if (finalX !== x || finalY !== y) {
        setPan({ x: finalX, y: finalY })
      }
      rafRef.current = null
      setIsPanning(false)
    } else {
      rafRef.current = requestAnimationFrame(runInertia)
    }
  }

  // Синхронизация startIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex)
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setDragY(0)
      setIsDraggingClose(false)
      setIsPanning(false)
      velRef.current = { x: 0, y: 0 }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isOpen, startIndex])

  // Body scroll lock
  // Блокировка скролла при открытом fullscreen gallery (только .app-scroll, не body)
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
      console.log('[scroll-lock] FullscreenGallery', { isOpen, className: scroller.className })
    }

    return () => {
      scroller.classList.remove('scroll-lock')
    }
  }, [isOpen])

  // ESC закрывает
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoom > 1) {
          setZoom(1)
          setPan({ x: 0, y: 0 })
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, zoom, onClose])

  // Стрелки влево/вправо
  useEffect(() => {
    if (!isOpen || zoom > 1) return

    const handleArrow = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prev()
      } else if (e.key === 'ArrowRight') {
        next()
      }
    }

    document.addEventListener('keydown', handleArrow)
    return () => document.removeEventListener('keydown', handleArrow)
  }, [isOpen, zoom, images.length])

  const prev = () => {
    if (zoom > 1) return
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }

  const next = () => {
    if (zoom > 1) return
    setCurrentIndex((i) => (i + 1) % images.length)
  }

  // Double-tap detector
  const handleDoubleTap = (e: React.MouseEvent) => {
    // Не обрабатывать если был drag
    if (isDraggingClose || Math.abs(dragY) > 10) {
      e.stopPropagation()
      return
    }
    
    const now = Date.now()
    if (now - lastTapTimeRef.current < 260) {
      // Double tap
      e.preventDefault()
      e.stopPropagation()
      if (zoom === 1) {
        setZoom(2)
        setPan({ x: 0, y: 0 })
      } else {
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
      lastTapTimeRef.current = 0
    } else {
      lastTapTimeRef.current = now
    }
  }

  // Pointer handlers для drag-to-close и pan
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom !== 1) {
      // Pan mode
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      setIsPanning(true)
      panStartRef.current = {
        x: pan.x,
        y: pan.y,
        startX: e.clientX,
        startY: e.clientY,
      }
      lastPanRef.current = { x: pan.x, y: pan.y }
      velRef.current = { x: 0, y: 0 }
      return
    }

    // Drag-to-close mode (zoom === 1)
    setIsDraggingClose(true)
    startYRef.current = e.clientY
    startXRef.current = e.clientX
    lastYRef.current = e.clientY
    lastTRef.current = performance.now()
    velYRef.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (zoom > 1 && panStartRef.current) {
      // Pan mode with rubber
      const dx = e.clientX - panStartRef.current.startX
      const dy = e.clientY - panStartRef.current.startY
      
      const maxPan = (zoom - 1) * 160
      const rawX = panStartRef.current.x + dx
      const rawY = panStartRef.current.y + dy
      
      const x = rubber(rawX, -maxPan, maxPan)
      const y = rubber(rawY, -maxPan, maxPan)
      
      // Update velocity
      const now = performance.now()
      const dt = Math.max(1, now - lastTRef.current)
      velRef.current = {
        x: (x - lastPanRef.current.x) / dt * 16,
        y: (y - lastPanRef.current.y) / dt * 16,
      }
      lastPanRef.current = { x, y }
      lastTRef.current = now
      
      setPan({ x, y })
      return
    }

    if (!isDraggingClose || zoom !== 1) return

    const dy = e.clientY - startYRef.current
    const dx = e.clientX - startXRef.current

    // Определение направления: если горизонтальный swipe сильнее -> отменить drag-to-close
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      setIsDraggingClose(false)
      setDragY(0)
      touchStartX.current = startXRef.current
      touchEndX.current = e.clientX
      return
    }

    // Если тянем вверх -> уменьшить эффект
    const adjustedDy = dy < 0 ? dy * 0.35 : dy
    setDragY(adjustedDy)

    // Update velocity
    const now = performance.now()
    const dt = Math.max(1, now - lastTRef.current)
    velYRef.current = (e.clientY - lastYRef.current) / dt
    lastYRef.current = e.clientY
    lastTRef.current = now
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (zoom > 1 && panStartRef.current) {
      // Pan mode: start inertia
      panStartRef.current = null
      setIsPanning(false)
      
      // Start inertia if velocity is significant
      if (Math.abs(velRef.current.x) + Math.abs(velRef.current.y) > 0.1) {
        rafRef.current = requestAnimationFrame(runInertia)
      } else {
        // Spring back to bounds
        const maxPan = (zoom - 1) * 160
        const finalX = clamp(pan.x, -maxPan, maxPan)
        const finalY = clamp(pan.y, -maxPan, maxPan)
        if (finalX !== pan.x || finalY !== pan.y) {
          setPan({ x: finalX, y: finalY })
        }
      }
      return
    }

    if (!isDraggingClose) {
      // Check for horizontal swipe
      if (touchStartX.current !== null && touchEndX.current !== null) {
        const dx = touchStartX.current - touchEndX.current
        if (Math.abs(dx) > 45) {
          if (dx > 0) {
            next()
          } else {
            prev()
          }
        }
        touchStartX.current = null
        touchEndX.current = null
      }
      return
    }

    // Drag-to-close: check if should close
    const dy = dragY
    const v = velYRef.current
    const shouldClose = dy > 140 || v > 0.75

    if (shouldClose) {
      onClose()
    } else {
      // Spring back
      setDragY(0)
    }

    setIsDraggingClose(false)
  }

  // Touch handlers (legacy, для совместимости)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handlePointerDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.PointerEvent)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handlePointerMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.PointerEvent)
  }

  const handleTouchEnd = () => {
    handlePointerUp({} as React.PointerEvent)
  }

  // Mouse handlers (legacy, для совместимости)
  const handleMouseDown = (e: React.MouseEvent) => {
    handlePointerDown(e as any)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e as any)
  }

  const handleMouseUp = () => {
    handlePointerUp({} as React.PointerEvent)
  }

  if (!isOpen) return null

  const currentImage = images[currentIndex]
  
  // Overlay opacity based on dragY
  const overlayOpacity = Math.max(0.55, Math.min(1, 1 - Math.abs(dragY) / 420))

  return (
    <div
      className={`fullscreen-overlay ${mounted ? 'is-open' : ''}`}
      style={{ opacity: overlayOpacity }}
      onClick={(e) => {
        if (e.target === e.currentTarget && zoom === 1 && !isDraggingClose) {
          onClose()
        }
      }}
    >
      <div className="fs-topbar">
        <div className="fs-counter">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          className="fs-close"
          onClick={onClose}
          aria-label="Закрыть"
          type="button"
        >
          ✕
        </button>
      </div>

      <div
        className="fs-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`fs-imgwrap ${isDraggingClose ? 'is-dragging-close' : ''}`}
          style={{
            ['--close-y' as any]: `${Math.max(-40, dragY)}px`,
          } as React.CSSProperties}
        >
          <img
            ref={imgRef}
            src={currentImage}
            alt={`Photo ${currentIndex + 1}`}
            className={`fs-img ${isPanning ? 'is-panning' : ''}`}
            style={{
              ['--zoom' as any]: zoom,
              ['--pan-x' as any]: `${pan.x}px`,
              ['--pan-y' as any]: `${pan.y}px`,
            } as React.CSSProperties}
            onDoubleClick={(e) => {
              if (!isDraggingClose && Math.abs(dragY) < 10) {
                handleDoubleTap(e)
              }
            }}
            onClick={(e) => {
              // Обрабатывать single click только если не было drag
              if (!isDraggingClose && Math.abs(dragY) < 10) {
                handleDoubleTap(e)
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            draggable={false}
          />
        </div>
      </div>

      {images.length > 1 && zoom === 1 && (
        <>
          <button
            className="fs-nav fs-prev"
            onClick={prev}
            aria-label="Предыдущее фото"
            type="button"
          >
            ←
          </button>
          <button
            className="fs-nav fs-next"
            onClick={next}
            aria-label="Следующее фото"
            type="button"
          >
            →
          </button>
        </>
      )}
    </div>
  )
}

