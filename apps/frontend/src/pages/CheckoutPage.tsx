import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import './checkout.css'

/**
 * Safely read JSON from Response
 * Returns null if response is empty or invalid JSON
 */
async function safeReadJson(res: Response): Promise<any> {
  const text = await res.text()
  if (!text || text.trim().length === 0) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

type DeliveryMethod = 'post' | 'cdek' | 'avito'

export const CheckoutPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { items, totalPrice, clear } = useCart()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Check if this is a LAB order from LabOrderPage
  const labOrder = (location.state as any)?.labOrder

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    method: 'post' as DeliveryMethod,
    comment: '',
    promoCode: '',
  })
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null)
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If no lab order and cart is empty, redirect to cart
    if (!labOrder && items.length === 0 && !success) {
      navigate('/app/cart')
    }
  }, [items, success, navigate, labOrder])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleApplyPromo = async () => {
    if (!formData.promoCode.trim()) return

    setApplyingPromo(true)
    setPromoError(null)

    try {
      const response = await fetch('/api/promos/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.promoCode,
          cartTotal: totalPrice,
        }),
      })

      const data = await safeReadJson(response)

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || 'Промокод недействителен'
        setPromoError(errorMessage)
        setPromoDiscount(null)
        setPromoApplied(false)
        return
      }

      if (data?.ok) {
        setPromoDiscount(data.discount || null)
        setPromoApplied(true)
        setPromoError(null)
      } else {
        setPromoError(data?.error || 'Промокод недействителен')
        setPromoDiscount(null)
        setPromoApplied(false)
      }
    } catch (error: any) {
      setPromoError('Ошибка при применении промокода')
      setPromoDiscount(null)
      setPromoApplied(false)
    } finally {
      setApplyingPromo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Check if user is logged in
    if (!user) {
      setError('Необходимо войти в систему')
      setIsSubmitting(false)
      return
    }

    // Check if Telegram user is available (required for tgId)
    const tgWebApp = (window as any).Telegram?.WebApp
    const tgUser = tgWebApp?.initDataUnsafe?.user
    if (!tgUser?.id) {
      setError('Откройте приложение из Telegram для оформления заказа')
      setIsSubmitting(false)
      return
    }

    try {
      // Validate items before processing
      const sourceItems = labOrder ? labOrder.items : items
      if (!sourceItems || sourceItems.length === 0) {
        setError('Корзина пуста')
        setIsSubmitting(false)
        return
      }

      // Use tgId from Telegram.WebApp.initDataUnsafe.user.id
      const tgId = Number(tgUser.id)
      if (!tgId || !Number.isFinite(tgId)) {
        setError('Не удалось получить ID пользователя Telegram')
        setIsSubmitting(false)
        return
      }

      // Build order items with guaranteed price and qty
      const orderItems = sourceItems.map((item: any, index: number) => {
        // Normalize price - must be a finite number
        const price = Number(item.price)
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error(`Товар "${item.title || `#${index + 1}`}" имеет неверную цену`)
        }

        // Normalize qty - must be integer > 0, default to 1
        const qty = Number(item.qty ?? 1)
        const qtyInt = Math.max(1, Math.floor(qty))
        if (!Number.isFinite(qty) || qtyInt <= 0) {
          throw new Error(`Товар "${item.title || `#${index + 1}`}" имеет неверное количество`)
        }

        // Build item based on type
        if (labOrder && item.type === 'lab') {
          return {
            type: 'lab' as const,
            labProductId: item.labProductId ?? null,
            title: item.title || 'Товар',
            article: item.article || null,
            price: price,
            qty: qtyInt,
            size: item.size ?? null,
            artistName: item.artistName ?? null,
          }
        } else {
          return {
            type: 'product' as const,
            productId: item.productId || null,
            title: item.title || 'Товар',
            article: item.article ?? null,
            price: price,
            qty: qtyInt,
            size: item.size ?? null,
          }
        }
      })

      // Build payload - ONLY ONE user object
      const orderPayload = {
        user: {
          tgId: tgId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'USER',
          username: user.username ?? null,
          photo_url: user.avatar ?? null,
        },
        items: orderItems,
        delivery: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          method: formData.method,
        },
        ...(labOrder ? { comment: labOrder.comment } : formData.comment ? { comment: formData.comment } : {}),
        ...(promoApplied && formData.promoCode ? { promoCode: formData.promoCode } : {}),
      }

      // Send order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      // Safely read response
      const data = await safeReadJson(response)

      // Handle error response
      if (!response.ok) {
        const errorMessage =
          data?.error ||
          data?.message ||
          'Не удалось оформить заказ'
        setError(errorMessage)
        setIsSubmitting(false)
        return
      }

      // Handle success response - ONLY if status is 201
      if (response.status !== 201) {
        const errorMessage = data?.error || data?.message || 'Не удалось оформить заказ'
        setError(errorMessage)
        setIsSubmitting(false)
        return
      }

      // Extract order ID from response
      const orderId = data?.orderId || data?.id || null
      if (!orderId) {
        console.error('[CheckoutPage] No orderId in response:', data)
        setError('Заказ создан, но не получен ID заказа')
        setIsSubmitting(false)
        return
      }

      setOrderId(orderId)
      setSuccess(true)
      
      // Clear cart only if not lab order
      if (!labOrder) {
        clear()
      }

      // Trigger orders refresh event for ProfileContent
      window.dispatchEvent(new CustomEvent('orderCreated', { detail: { orderId } }))
    } catch (err: any) {
      console.error('Order creation error:', err)
      
      // Extract error message - filter out technical JSON errors
      let errorMessage = 'Не удалось оформить заказ'
      
      if (err.message && !err.message.includes('JSON') && !err.message.includes('Unexpected end')) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show checkout if we have items or lab order
  const displayItems = labOrder ? labOrder.items : items
  const displayTotal = labOrder 
    ? labOrder.items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)
    : totalPrice

  if (displayItems.length === 0 && !success) {
    return null
  }

  if (success) {
    return (
      <div className={`checkout-page ${mounted ? 'is-mounted' : ''}`}>
        <div className="checkout-success">
          <div className="checkout-success-icon">✅</div>
          <h1>Заказ принят!</h1>
          {orderId && (
            <p className="checkout-order-id">
              Номер заказа: <strong>#{orderId.slice(-6).toUpperCase()}</strong>
            </p>
          )}
          <p>Мы свяжемся с вами для подтверждения деталей доставки.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => navigate('/app/profile')}
              className="checkout-submit"
            >
              Мои заказы
            </button>
            <button
              onClick={() => navigate('/app')}
              className="checkout-submit"
              style={{ backgroundColor: 'transparent', border: '1px solid currentColor' }}
            >
              В каталог
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`checkout-page ${mounted ? 'is-mounted' : ''}`}>
      <h1 className="checkout-title">Оформление заказа</h1>

      <div className="checkout-summary">
        <h2 className="checkout-summary-title">
          {labOrder ? '🧪 LAB заказ' : 'Товары'}
        </h2>
        <div className="checkout-items">
          {displayItems.map((item: any, idx: number) => (
            <div key={`${item.productId || item.labProductId}-${item.size || 'no-size'}-${idx}`} className="checkout-item">
              <div className="checkout-item-info">
                <span className="checkout-item-title">
                  {item.title}
                  {item.type === 'lab' && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>🧪 LAB</span>}
                </span>
                <span className="checkout-item-article">{item.article}</span>
                {item.size && <span className="checkout-item-size">Размер: {item.size}</span>}
                {item.artistName && (
                  <span className="checkout-item-size" style={{ color: '#f5f5f5' }}>
                    Художник: {item.artistName}
                  </span>
                )}
              </div>
              <div className="checkout-item-qty">× {item.qty}</div>
              <div className="checkout-item-price">
                {(item.price * item.qty).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          ))}
        </div>
        {promoDiscount && (
          <div className="checkout-discount">
            <span>Скидка:</span>
            <span>-{promoDiscount.toLocaleString('ru-RU')} ₽</span>
          </div>
        )}
        <div className="checkout-total">
          <span>Итого:</span>
          <span>{(displayTotal - (promoDiscount || 0)).toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <h2 className="checkout-form-title">Данные доставки</h2>

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        <div className="checkout-field">
          <label htmlFor="fullName">ФИО *</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Иванов Иван Иванович"
          />
        </div>

        <div className="checkout-field">
          <label htmlFor="phone">Телефон *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        <div className="checkout-field">
          <label htmlFor="address">Адрес *</label>
          <input
            id="address"
            name="address"
            type="text"
            required
            value={formData.address}
            onChange={handleChange}
            placeholder="Город, улица, дом, квартира"
          />
        </div>

        <div className="checkout-field">
          <label htmlFor="method">Способ доставки *</label>
          <select
            id="method"
            name="method"
            required
            value={formData.method}
            onChange={handleChange}
          >
            <option value="post">Почта России</option>
            <option value="cdek">СДЭК</option>
            <option value="avito">Авито</option>
          </select>
        </div>

        <div className="checkout-field">
          <label htmlFor="promoCode">Промокод (необязательно)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="promoCode"
              name="promoCode"
              type="text"
              value={formData.promoCode}
              onChange={handleChange}
              placeholder="Введите промокод"
              disabled={promoApplied}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={applyingPromo || !formData.promoCode.trim() || promoApplied}
              className="checkout-promo-btn"
            >
              {applyingPromo ? '...' : promoApplied ? '✓' : 'Применить'}
            </button>
          </div>
          {promoError && (
            <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '4px' }}>
              {promoError}
            </div>
          )}
          {promoApplied && (
            <div style={{ fontSize: '12px', color: '#51cf66', marginTop: '4px' }}>
              Промокод применён! Скидка: {promoDiscount} ₽
            </div>
          )}
        </div>

        <div className="checkout-field">
          <label htmlFor="comment">Комментарий (необязательно)</label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            value={formData.comment}
            onChange={handleChange}
            placeholder="Дополнительная информация для доставки"
          />
        </div>

        <button
          type="submit"
          className="checkout-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
        </button>
      </form>
    </div>
  )
}
