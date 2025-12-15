import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { flyOrderToArtist } from '../utils/flyOrderToArtist'
import { CustomPreview3DFlip } from '../modules/lab/CustomPreview3DFlip'
import { getLabProducts } from '../api/labApi'
import './lab-order.css'

import { apiUrl } from '../utils/api'

type CanvasType = 'hoodie' | 'tshirt' | 'sneakers' | 'cap' | 'bag'
type CanvasColor = 'black' | 'white' | 'gray' | 'custom'

const sideOptionsByCanvas: Record<string, string[] | null> = {
  hoodie: ['Грудь', 'Спина полностью'],
  tshirt: ['Грудь', 'Спина полностью'],
  sneakers: ['Полный', 'Одна сторона'],
  cap: null,
  bag: null,
}

export const LabOrderPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [canvas, setCanvas] = useState<CanvasType>('hoodie')
  const [color, setColor] = useState<CanvasColor>('black')
  const [customColor, setCustomColor] = useState('')
  const [side, setSide] = useState<string>('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get lab product from location state
  const labProductId = (location.state as any)?.labProductId
  const artistName = (location.state as any)?.artistName

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  useEffect(() => {
    // Сброс стороны при смене холста
    const options = sideOptionsByCanvas[canvas]
    if (options && options.length > 0) {
      setSide(options[0])
    } else {
      setSide('')
    }
  }, [canvas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!user) {
      setError('Необходимо войти в систему')
      setIsSubmitting(false)
      return
    }

    try {
      // If labProductId is provided, create order with LAB product
      if (labProductId && artistName) {
        // Load product details
        const products = await getLabProducts()
        const product = products.find(p => p.id === labProductId)
        
        if (!product) {
          throw new Error('LAB товар не найден')
        }

        // Create order with LAB product
        const orderPayload = {
          user: {
            tgId: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'USER',
            username: user.username,
            photo_url: user.photo_url,
          },
          items: [{
            type: 'lab' as const,
            labProductId: product.id,
            artistName: artistName,
            title: product.title,
            article: `LAB-${product.id.slice(0, 8).toUpperCase()}`,
            price: product.price,
            qty: 1,
          }],
          delivery: {
            fullName: '', // Will be filled in checkout
            phone: '',
            address: '',
            method: 'post' as const,
          },
          comment: `Кастом: ${canvas}, цвет: ${color === 'custom' ? customColor : color}${side ? `, сторона: ${side}` : ''}. ${comment}`,
        }

        // Navigate to checkout with order data
        navigate('/app/checkout', {
          state: { labOrder: orderPayload }
        })
        return
      }

      // Otherwise, just show success (old behavior for custom orders)
      const submitButton = e.currentTarget.querySelector('.lab-order-submit') as HTMLElement
      if (submitButton) {
        flyOrderToArtist({ fromEl: submitButton })
      }

      setTimeout(() => {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
        }, 3000)
      }, 800)
    } catch (err: any) {
      console.error('Lab order error:', err)
      setError(err.message || 'Не удалось оформить заказ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sideOptions = sideOptionsByCanvas[canvas]

  // Маппинг цвета для компонента (grey вместо gray)
  const colorKey = color === 'gray' ? 'grey' : color

  return (
    <div className={`lab-order-root ${mounted ? 'is-mounted' : ''}`}>
      <div className="lab-order-container">
        <h1 className="lab-order-title">Заказ кастома</h1>

        {/* Превью кастома */}
        <div className="lab-order-preview">
          <CustomPreview3DFlip
            canvas={canvas}
            color={colorKey}
            customColor={customColor}
            side={side}
          />
        </div>

        <form onSubmit={handleSubmit} className="lab-order-form">
          {/* Выбор холста */}
          <div className="lab-order-field" style={{ animationDelay: '0.1s' }}>
            <label className="lab-order-label">Холст</label>
            <div className="lab-order-options">
              {(['hoodie', 'tshirt', 'sneakers', 'cap', 'bag'] as CanvasType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`lab-order-option ${canvas === option ? 'active' : ''}`}
                  onClick={() => setCanvas(option)}
                >
                  {option === 'hoodie' && 'Худи'}
                  {option === 'tshirt' && 'Футболка'}
                  {option === 'sneakers' && 'Кроссовки'}
                  {option === 'cap' && 'Кепка'}
                  {option === 'bag' && 'Сумка'}
                </button>
              ))}
            </div>
          </div>

          {/* Цвет холста */}
          <div className="lab-order-field" style={{ animationDelay: '0.2s' }}>
            <label className="lab-order-label">Цвет холста</label>
            <div className="lab-order-options">
              {(['black', 'white', 'gray', 'custom'] as CanvasColor[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`lab-order-option ${color === option ? 'active' : ''}`}
                  onClick={() => setColor(option)}
                >
                  {option === 'black' && 'Черный'}
                  {option === 'white' && 'Белый'}
                  {option === 'gray' && 'Серый'}
                  {option === 'custom' && 'Свой'}
                </button>
              ))}
            </div>
            {color === 'custom' && (
              <input
                type="text"
                className="lab-order-input"
                placeholder="Укажите цвет"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                style={{ marginTop: '12px' }}
              />
            )}
          </div>

          {/* Сторона холста */}
          {sideOptions && (
            <div className="lab-order-field" style={{ animationDelay: '0.3s' }}>
              <label className="lab-order-label">Сторона холста</label>
              <div className="lab-order-options">
                {sideOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`lab-order-option ${side === option ? 'active' : ''}`}
                    onClick={() => setSide(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Комментарий */}
          <div className="lab-order-field" style={{ animationDelay: '0.4s' }}>
            <label className="lab-order-label">Комментарий / Идея</label>
            <textarea
              className="lab-order-textarea"
              placeholder="Опишите вашу идею для кастома..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Кнопка отправки */}
          <div className="lab-order-actions" style={{ animationDelay: '0.5s' }}>
            <button 
              type="submit" 
              className="lab-order-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : labProductId ? 'Перейти к оформлению' : 'Отправить заявку'}
            </button>
            <button
              type="button"
              className="lab-order-back"
              onClick={() => navigate('/app/lab')}
            >
              ← Назад к лаборатории
            </button>
          </div>

          {error && (
            <div className="lab-order-error" style={{ padding: '12px', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.4)', borderRadius: '8px', color: '#ff6b6b', marginTop: '16px' }}>
              {error}
            </div>
          )}

          {submitted && !labProductId && (
            <div className="lab-order-success">
              ✅ Отправлено художнику
            </div>
          )}
        </form>

        {/* Цель для анимации полета */}
        <div className="lab-order-target" data-lab-target />
      </div>
    </div>
  )
}

