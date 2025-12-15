import { useState, useEffect } from 'react'
import './custom-preview-3d-flip.css'

type CanvasKey = 'hoodie' | 'tshirt' | 'sneakers' | 'cap' | 'bag'
type ColorKey = 'black' | 'white' | 'grey' | 'custom'
type ViewKey = 'front' | 'back' | 'full' | 'side' | 'default'

type Props = {
  canvas: CanvasKey
  color: ColorKey
  customColor?: string
  side: string | null // 'Грудь'|'Спина полностью'|'Полный'|'Одна сторона'|null
}

const srcByCanvasView: Record<CanvasKey, Record<ViewKey, string>> = {
  hoodie: {
    front: '/assets/mocks3d/hoodie-front.png',
    back: '/assets/mocks3d/hoodie-back.png',
    full: '',
    side: '',
    default: '/assets/mocks3d/hoodie-front.png',
  },
  tshirt: {
    front: '/assets/mocks3d/tshirt-front.png',
    back: '/assets/mocks3d/tshirt-back.png',
    full: '',
    side: '',
    default: '/assets/mocks3d/tshirt-front.png',
  },
  sneakers: {
    full: '/assets/mocks3d/sneakers-full.png',
    side: '/assets/mocks3d/sneakers-side.png',
    front: '',
    back: '',
    default: '/assets/mocks3d/sneakers-full.png',
  },
  cap: {
    default: '/assets/mocks3d/cap.png',
    front: '',
    back: '',
    full: '',
    side: '',
  },
  bag: {
    default: '/assets/mocks3d/bag.png',
    front: '',
    back: '',
    full: '',
    side: '',
  },
}

export const CustomPreview3DFlip: React.FC<Props> = ({ canvas, color, customColor, side }) => {
  const [mounted, setMounted] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Определение вида
  const view: ViewKey = (() => {
    if (canvas === 'hoodie' || canvas === 'tshirt') {
      return side === 'Спина полностью' ? 'back' : 'front'
    }
    if (canvas === 'sneakers') {
      return side === 'Одна сторона' ? 'side' : 'full'
    }
    return 'default'
  })()

  // Определение ключа зоны печати
  const printKey = (() => {
    if (canvas === 'hoodie' || canvas === 'tshirt') {
      if (side === 'Грудь') return 'front-chest'
      if (side === 'Спина полностью') return 'back-full'
      return 'none'
    }
    if (canvas === 'sneakers') {
      if (side === 'Полный') return 'sneakers-full'
      if (side === 'Одна сторона') return 'sneakers-side'
      return 'none'
    }
    return 'none'
  })()

  const frontSrc = srcByCanvasView[canvas].front || srcByCanvasView[canvas].default
  const backSrc = srcByCanvasView[canvas].back || srcByCanvasView[canvas].default
  const currentSrc = srcByCanvasView[canvas][view] || srcByCanvasView[canvas].default

  const needsFlip = canvas === 'hoodie' || canvas === 'tshirt'
  const isBack = view === 'back'

  // Debug
  useEffect(() => {
    console.log('[CustomPreview3DFlip]', {
      canvas,
      color,
      side,
      view,
      frontSrc,
      backSrc,
      currentSrc,
      needsFlip,
      isBack,
    })
  }, [canvas, color, side, view, frontSrc, backSrc, currentSrc, needsFlip, isBack])

  const canvasLabels: Record<CanvasKey, string> = {
    hoodie: 'Худи',
    tshirt: 'Футболка',
    sneakers: 'Кроссовки',
    cap: 'Кепка',
    bag: 'Сумка',
  }

  const colorLabels: Record<ColorKey, string> = {
    black: 'Черный',
    white: 'Белый',
    grey: 'Серый',
    custom: customColor || 'Свой',
  }

  const label = `${canvasLabels[canvas]} • ${colorLabels[color]}${side ? ` • ${side}` : ''}`

  // Наклон при движении мыши (только для десктопа)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)

    setTilt({
      x: deltaY * 5, // до 5 градусов
      y: deltaX * 5,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  // Проверка что пути не пустые
  if (!frontSrc && !backSrc && !currentSrc) {
    console.error('[CustomPreview3DFlip] No image source found for canvas:', canvas)
    return (
      <div className="cp3df">
        <div className="cp3df-stage">
          <div style={{ color: '#f5f5f5', textAlign: 'center', padding: '40px' }}>
            Ошибка: изображение не найдено
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`cp3df ${mounted ? 'is-mounted' : ''} cp3df-${canvas}`}>
      <div
        className="cp3df-stage"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          tilt.x !== 0 || tilt.y !== 0
            ? {
                transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }
            : undefined
        }
      >
        {needsFlip ? (
          <div className={`cp3df-flip ${isBack ? 'is-back' : ''}`}>
            <div className="face front">
              <img
                className="mock"
                src={frontSrc}
                alt=""
                onError={(e) => {
                  console.error('Failed to load front image:', frontSrc)
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div className="face back">
              <img
                className="mock"
                src={backSrc}
                alt=""
                onError={(e) => {
                  console.error('Failed to load back image:', backSrc)
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
        ) : (
          <img
            className="mock"
            src={currentSrc}
            alt=""
            onError={(e) => {
              console.error('Failed to load image:', currentSrc)
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}

        {/* Color overlay */}
        <div
          className={`cp3df-color cp3df-color-${color}`}
          style={color === 'custom' ? { background: customColor } : undefined}
        />

        {/* Print zone */}
        <div className={`cp3df-print cp3df-print-${printKey}`} />
      </div>

      <div className="cp3df-label">{label}</div>
    </div>
  )
}

