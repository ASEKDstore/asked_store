import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useEffect, useState } from 'react'
import './cart.css'

export const CartPage = () => {
  const navigate = useNavigate()
  const { items, removeItem, setQty, totalQty, totalPrice } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  if (items.length === 0) {
    return (
      <div className={`cart-page ${mounted ? 'is-mounted' : ''}`}>
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Корзина пустая</h2>
          <p>Добавьте товары из каталога</p>
          <button
            className="cart-empty-btn"
            onClick={() => navigate('/app/catalog')}
          >
            Перейти в каталог
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`cart-page ${mounted ? 'is-mounted' : ''}`}>
      <h1 className="cart-title">Корзина</h1>

      <div className="cart-items">
        {items.map((item, idx) => (
          <div key={`${item.productId}-${item.size || 'no-size'}-${idx}`} className="cart-item">
            <div
              className="cart-item-image"
              style={{ backgroundImage: `url(${item.image})` }}
            />

            <div className="cart-item-info">
              <div className="cart-item-article">{item.article}</div>
              <div className="cart-item-title">{item.title}</div>
              {item.size && (
                <div className="cart-item-size">Размер: {item.size}</div>
              )}
              <div className="cart-item-price">
                {item.price.toLocaleString('ru-RU')} ₽
              </div>
            </div>

            <div className="cart-item-controls">
              <div className="cart-item-qty">
                <button
                  className="qty-btn qty-btn-minus"
                  onClick={() => setQty(item.productId, item.size, item.qty - 1)}
                  aria-label="Уменьшить количество"
                >
                  −
                </button>
                <span className="qty-value">{item.qty}</span>
                <button
                  className="qty-btn qty-btn-plus"
                  onClick={() => setQty(item.productId, item.size, item.qty + 1)}
                  aria-label="Увеличить количество"
                >
                  +
                </button>
              </div>

              <button
                className="cart-item-remove"
                onClick={() => removeItem(item.productId, item.size)}
                aria-label="Удалить товар"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Товаров:</span>
          <span>{totalQty}</span>
        </div>
        <div className="cart-summary-row cart-summary-total">
          <span>Сумма:</span>
          <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>

        <div className="cart-summary-actions">
          <button
            className="cart-checkout-btn"
            onClick={() => navigate('/app/checkout')}
          >
            Оформить заказ
          </button>
          <button
            className="cart-try-on-btn"
            onClick={() => navigate('/app/try-on')}
          >
            Виртуальная примерка
          </button>
        </div>
      </div>
    </div>
  )
}




