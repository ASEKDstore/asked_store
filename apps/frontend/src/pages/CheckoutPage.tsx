import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import './checkout.css'

import { apiUrl } from '../utils/api'

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
      const response = await fetch(apiUrl('/api/promos/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.promoCode,
          cartTotal: totalPrice,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setPromoDiscount(data.discount)
        setPromoApplied(true)
        setPromoError(null)
      } else {
        setPromoError(data.error || 'Промокод недействителен')
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

    if (!user) {
      setError('Необходимо войти в систему')
      setIsSubmitting(false)
      return
    }

    try {
      // If lab order, use its items, otherwise use cart items
      const orderItems = labOrder 
        ? labOrder.items 
        : items.map(item => ({
            type: 'product' as const,
            productId: item.productId,
            title: item.title,
            article: item.article,
            price: item.price,
            qty: item.qty,
            size: item.size,
          }))

      const orderPayload = {
        user: {
          tgId: user.tgId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'USER',
          username: user.username,
          photo_url: user.avatar,
        },
        items: orderItems,
        delivery: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          method: formData.method,
        },
        comment: labOrder ? labOrder.comment : (formData.comment || undefined),
        promoCode: promoApplied ? formData.promoCode : undefined,
        discount: promoDiscount || undefined,
      }

      const response = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при создании заказа')
      }

      const order = await response.json()
      setOrderId(order.id)
      setSuccess(true)
      
      // Clear cart only if not lab order
      if (!labOrder) {
        clear()
      }

      // Navigate to profile after 2 seconds
      setTimeout(() => {
        navigate('/app/profile', { state: { modal: true } })
      }, 2000)
    } catch (err: any) {
      console.error('Order creation error:', err)
      setError(err.message || 'Не удалось оформить заказ. Попробуйте позже.')
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
          <h1>Заказ успешно оформлен!</h1>
          {orderId && (
            <p className="checkout-order-id">
              Номер заказа: <strong>#{orderId.slice(-6).toUpperCase()}</strong>
            </p>
          )}
          <p>Вы будете перенаправлены в профиль...</p>
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
