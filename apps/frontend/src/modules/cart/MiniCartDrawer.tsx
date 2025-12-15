import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import './mini-cart.css'

type Props = {
  open: boolean
  onClose: () => void
}

export const MiniCartDrawer: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const { items, removeItem, setQty, totalQty, totalPrice, clear } = useCart()

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  // Блокируем скролл body при открытом drawer
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleGoToCart = () => {
    onClose()
    navigate('/app/cart')
  }

  const handleCheckout = () => {
    onClose()
    navigate('/app/checkout')
  }

  return (
    <>
      <div
        className={`mini-cart-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />

      <div className={`mini-cart ${open ? 'open' : ''}`}>
        <div className="mini-cart-header">
          <h2 className="mini-cart-title">Корзина</h2>
          <button
            className="mini-cart-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="mini-cart-empty">
            <div className="mini-cart-empty-icon">🛒</div>
            <p>Корзина пустая</p>
          </div>
        ) : (
          <>
            <div className="mini-cart-items">
              {items.slice(0, 5).map((item, idx) => (
                <div
                  key={`${item.productId}-${item.size || 'no-size'}-${idx}`}
                  className="mini-cart-item"
                >
                  <div
                    className="mini-cart-item-image"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />

                  <div className="mini-cart-item-info">
                    <div className="mini-cart-item-title">{item.title}</div>
                    {item.size && (
                      <div className="mini-cart-item-size">Размер: {item.size}</div>
                    )}
                    <div className="mini-cart-item-price">
                      {item.price.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>

                  <div className="mini-cart-item-controls">
                    <div className="mini-cart-item-qty">
                      <button
                        className="mini-qty-btn"
                        onClick={() => setQty(item.productId, item.size, item.qty - 1)}
                        aria-label="Уменьшить"
                      >
                        −
                      </button>
                      <span className="mini-qty-value">{item.qty}</span>
                      <button
                        className="mini-qty-btn"
                        onClick={() => setQty(item.productId, item.size, item.qty + 1)}
                        aria-label="Увеличить"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="mini-cart-item-remove"
                      onClick={() => removeItem(item.productId, item.size)}
                      aria-label="Удалить"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mini-cart-summary">
              <div className="mini-cart-summary-row">
                <span>Товаров:</span>
                <span>{totalQty}</span>
              </div>
              <div className="mini-cart-summary-total">
                <span>Сумма:</span>
                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>

            <div className="mini-cart-actions">
              <button className="mini-cart-btn-primary" onClick={handleGoToCart}>
                Перейти в корзину
              </button>
              <button className="mini-cart-btn-secondary" onClick={handleCheckout}>
                Оформить
              </button>
              <button className="mini-cart-btn-clear" onClick={clear}>
                Очистить
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}




