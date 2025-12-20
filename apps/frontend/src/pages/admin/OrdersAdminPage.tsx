import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import type { Order } from '../../types/order'
import { getOrderLineItems } from '../../utils/normalizeOrder'
import './AdminPages.css'

export const OrdersAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [statusFilter, searchQuery])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getOrders({
        status: statusFilter || undefined,
        q: searchQuery || undefined,
      }) as Order[]
      setOrders(data)
    } catch (error: any) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.patchOrder(orderId, status)
      loadOrders()
    } catch (error: any) {
      console.error('Failed to update order:', error)
      alert('Ошибка при обновлении статуса')
    }
  }

  const statusOptions = [
    { value: '', label: 'Все' },
    { value: 'new', label: 'Новые' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Готовы' },
    { value: 'canceled', label: 'Отменены' },
  ]

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Заказы</h2>
        <button onClick={loadOrders} className="admin-refresh-btn">
          🔄 Обновить
        </button>
      </div>

      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '8px',
        border: '1px solid #333',
        fontSize: '14px',
        color: '#ccc'
      }}>
        💡 <strong>Важно:</strong> Админы должны нажать <strong>Start</strong> боту в Telegram, чтобы получать уведомления о новых заказах в личку.
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Поиск по ID, имени, телефону..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-search-input"
        />
        <div className="admin-chips">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              className={`admin-chip ${statusFilter === opt.value ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">Заказов не найдено</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>ID</th>
                <th>Покупатель</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const lineItems = getOrderLineItems(order)
                const hasLabItems = lineItems.some(item => item.type === 'lab')
                return (
                <tr key={order.id} className={hasLabItems ? 'admin-order-lab' : ''}>
                  <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <button
                      className="admin-link"
                      onClick={() => setSelectedOrder(order)}
                    >
                      #{order.id.slice(-6).toUpperCase()}
                      {hasLabItems && <span style={{ marginLeft: '4px' }}>🧪</span>}
                    </button>
                  </td>
                  <td>
                    <div>
                      <div>{order.user.name}</div>
                      {order.user.username && (
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          @{order.user.username}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {order.totalPrice.toLocaleString('ru-RU')} ₽
                    {order.discount && (
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        -{order.discount} ₽
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="admin-select"
                    >
                      <option value="new">Новый</option>
                      <option value="in_progress">В работе</option>
                      <option value="done">Готов</option>
                      <option value="canceled">Отменён</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="admin-btn-small"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Детали
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Заказ #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="admin-modal-content">
              <div className="admin-detail-section">
                <h4>Покупатель</h4>
                <p>{selectedOrder.user.name}</p>
                {selectedOrder.user.username && <p>@{selectedOrder.user.username}</p>}
                <p>TG ID: {selectedOrder.user.tgId}</p>
              </div>
              <div className="admin-detail-section">
                <h4>Товары</h4>
                {(() => {
                  const lineItems = getOrderLineItems(selectedOrder)
                  if (lineItems.length === 0) {
                    return <p style={{ opacity: 0.7 }}>Товары не найдены</p>
                  }
                  return lineItems.map((item, idx) => (
                    <div key={idx} className={`admin-detail-item ${item.type === 'lab' ? 'admin-detail-item-lab' : ''}`}>
                      <div>
                        {item.title} ({item.article})
                        {item.type === 'lab' && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>🧪 LAB</span>}
                      </div>
                      {item.size && <div>Размер: {item.size}</div>}
                      {item.artistName && <div><strong>Художник:</strong> {item.artistName}</div>}
                      <div>{item.qty} × {item.price} ₽ = {(item.qty || 0) * (item.price || 0)} ₽</div>
                    </div>
                  ))
                })()}
              </div>
              <div className="admin-detail-section">
                <h4>Доставка</h4>
                <p>{selectedOrder.delivery.fullName}</p>
                <p>{selectedOrder.delivery.phone}</p>
                <p>{selectedOrder.delivery.address}</p>
                <p>{selectedOrder.delivery.method}</p>
              </div>
              {selectedOrder.comment && (
                <div className="admin-detail-section">
                  <h4>Комментарий</h4>
                  <p>{selectedOrder.comment}</p>
                </div>
              )}
              {selectedOrder.promoCode && (
                <div className="admin-detail-section">
                  <h4>Промокод</h4>
                  <p>{selectedOrder.promoCode} (-{selectedOrder.discount} ₽)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

