import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { isAdminId } from '../../config/admins'
import type { Order } from '../../types/order'
import './ProfilePage.css'

import { apiUrl } from '../../utils/api'
const SETTINGS_NOTIFICATIONS_KEY = 'asked_settings_notifications'

export const ProfileContent: React.FC = () => {
  const { user, isTelegram, refresh, displayName, initials } = useUser()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [refreshed, setRefreshed] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem(SETTINGS_NOTIFICATIONS_KEY)
    return stored ? JSON.parse(stored) : true
  })

  const loadOrders = async () => {
    if (!user?.id) {
      setOrdersLoading(false)
      return
    }

    try {
      setOrdersLoading(true)
      const response = await fetch(apiUrl(`/api/orders?tgId=${user.id}`))
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        console.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [user?.id])

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      new: 'Новый',
      in_progress: 'В работе',
      done: 'Готов',
      canceled: 'Отменён',
    }
    return statusMap[status]
  }

  const getStatusEmoji = (status: Order['status']) => {
    const emojiMap = {
      new: '🆕',
      in_progress: '⚙️',
      done: '✅',
      canceled: '❌',
    }
    return emojiMap[status]
  }

  const getDeliveryMethodName = (method: string) => {
    const methodMap: Record<string, string> = {
      post: 'Почта России',
      cdek: 'СДЭК',
      avito: 'Авито',
    }
    return methodMap[method] || method
  }

  const handleCopyId = async () => {
    if (!user) return
    
    try {
      await navigator.clipboard.writeText(String(user.id))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleRefresh = () => {
    refresh()
    setRefreshed(true)
    setTimeout(() => setRefreshed(false), 1200)
  }

  const handleToggleNotifications = () => {
    const newValue = !notifications
    setNotifications(newValue)
    localStorage.setItem(SETTINGS_NOTIFICATIONS_KEY, JSON.stringify(newValue))
  }


  const handleResetSettings = () => {
    if (confirm('Сбросить все настройки?')) {
      setNotifications(true)
      localStorage.removeItem(SETTINGS_NOTIFICATIONS_KEY)
    }
  }

  const displayUsername = user?.username ? `@${user.username}` : null
  const isAdmin = isAdminId(user?.id)

  return (
    <div className="profile-container">
      {/* Hero Section */}
      <div className="profile-hero">
        <div className="profile-avatar-wrapper">
          {user?.photoUrl || user?.photo_url ? (
            <img
              src={user.photoUrl || user.photo_url || ''}
              alt={displayName}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar profile-avatar-initials">
              {initials}
            </div>
          )}
        </div>
        <h1 className="profile-name">{displayName}</h1>
        {displayUsername && (
          <p className="profile-username">{displayUsername}</p>
        )}
        <div className="profile-badge">
          {isTelegram ? 'Telegram WebApp ✅' : 'Browser mode'}
        </div>
      </div>

      {/* Data Card */}
      <div className="profile-card">
        <h2 className="profile-card-title">Данные</h2>
        <div className="profile-row">
          <span className="profile-label">Telegram ID</span>
          <div className="profile-value-group">
            <span className="profile-value">{user?.id || '—'}</span>
            <button
              className="profile-btn-icon"
              onClick={handleCopyId}
              aria-label="Копировать ID"
              title="Копировать ID"
            >
              📋
            </button>
          </div>
        </div>

        {user?.language_code && (
          <div className="profile-row">
            <span className="profile-label">Язык</span>
            <span className="profile-value">{user.language_code.toUpperCase()}</span>
          </div>
        )}

        <div className="profile-actions-inline">
          <button
            className="profile-btn profile-btn--secondary"
            onClick={handleRefresh}
          >
            Обновить профиль
          </button>
        </div>
      </div>

      {/* Orders Section */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h2 className="profile-card-title">Мои заказы</h2>
          <button
            className="profile-refresh-btn"
            onClick={loadOrders}
            disabled={ordersLoading}
            title="Обновить"
          >
            {ordersLoading ? '⏳' : '🔄'}
          </button>
        </div>
        {ordersLoading ? (
          <div className="profile-loading">
            <p>Загрузка...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="profile-empty-state">
            <p>Заказов пока нет</p>
            <button
              className="profile-btn profile-btn--primary"
              onClick={() => navigate('/app/catalog')}
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="profile-orders">
            {orders.map((order, idx) => (
              <div
                key={order.id}
                className={`profile-order-card ${expandedOrderId === order.id ? 'is-expanded' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div
                  className="profile-order-header"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="profile-order-info">
                    <div className="profile-order-id">
                      #{order.id.slice(-6).toUpperCase()}
                      {order.items.some(item => item.type === 'lab') && (
                        <span style={{ marginLeft: '6px', fontSize: '12px' }}>🧪 LAB</span>
                      )}
                    </div>
                    <div className="profile-order-date">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="profile-order-status">
                    <span className="profile-order-status-emoji">
                      {getStatusEmoji(order.status)}
                    </span>
                    <span className="profile-order-status-text">
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="profile-order-summary">
                    <div className="profile-order-price">
                      {order.totalPrice.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="profile-order-items-count">
                      {order.items.length} {order.items.length === 1 ? 'позиция' : 'позиций'}
                    </div>
                  </div>
                  <div className="profile-order-chevron">
                    {expandedOrderId === order.id ? '▲' : '▼'}
                  </div>
                </div>
                <div className="profile-order-details">
                  <div className="profile-order-section">
                    <h3 className="profile-order-section-title">Товары</h3>
                    <div className="profile-order-items">
                      {order.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="profile-order-item">
                          <div className="profile-order-item-info">
                            <span className="profile-order-item-title">
                              {item.title}
                              {item.type === 'lab' && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.7 }}>🧪 LAB</span>}
                            </span>
                            <span className="profile-order-item-article">{item.article}</span>
                            {item.size && (
                              <span className="profile-order-item-size">Размер: {item.size}</span>
                            )}
                            {item.artistName && (
                              <span className="profile-order-item-size" style={{ color: '#f5f5f5' }}>
                                Художник: {item.artistName}
                              </span>
                            )}
                          </div>
                          <div className="profile-order-item-qty">× {item.qty}</div>
                          <div className="profile-order-item-price">
                            {(item.price * item.qty).toLocaleString('ru-RU')} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="profile-order-section">
                    <h3 className="profile-order-section-title">Доставка</h3>
                    <div className="profile-order-delivery">
                      <p><strong>ФИО:</strong> {order.delivery.fullName}</p>
                      <p><strong>Телефон:</strong> {order.delivery.phone}</p>
                      <p><strong>Адрес:</strong> {order.delivery.address}</p>
                      <p><strong>Способ:</strong> {getDeliveryMethodName(order.delivery.method)}</p>
                    </div>
                  </div>
                  {order.comment && (
                    <div className="profile-order-section">
                      <h3 className="profile-order-section-title">Комментарий</h3>
                      <p className="profile-order-comment">{order.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="profile-card profile-admin">
          <div className="profile-admin-head">
            <div className="profile-admin-title">ADMIN MODE</div>
            <div className="profile-admin-badge">PRIVATE</div>
          </div>

          <div className="profile-admin-text">
            Закрытый доступ к управлению ASKED Store.
            Панели, заказы, баннеры, промокоды.
          </div>

          <button
            className="profile-btn profile-btn-admin"
            type="button"
            onClick={() => navigate('/app/admin')}
          >
            Войти в админку →
          </button>
        </div>
      )}

      {/* Settings Section */}
      <div className="profile-card">
        <h2 className="profile-card-title">Настройки</h2>
        <div className="profile-settings">
          <div className="profile-setting-row">
            <div className="profile-setting-label">
              <span>Уведомления</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications}
                onChange={handleToggleNotifications}
              />
              <span className="toggle-slider" />
            </label>
          </div>


          <div className="profile-actions-inline">
            <button
              className="profile-btn profile-btn--secondary"
              onClick={handleResetSettings}
            >
              Сбросить настройки
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {copied && (
        <div className="profile-toast">
          Скопировано ✅
        </div>
      )}
      {refreshed && (
        <div className="profile-toast">
          Профиль обновлён
        </div>
      )}
    </div>
  )
}

