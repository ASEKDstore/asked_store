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
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [clearMode, setClearMode] = useState<'all' | 'beforeDate' | 'testOnly'>('testOnly')
  const [clearBeforeDate, setClearBeforeDate] = useState('')
  const [clearConfirm, setClearConfirm] = useState('')
  const [clearing, setClearing] = useState(false)
  const [testingNotifications, setTestingNotifications] = useState(false)

  useEffect(() => {
    loadOrders()
    loadStats()
  }, [statusFilter, searchQuery])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const data = await api.getOrderStats()
      setStats(data)
    } catch (error: any) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

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
      loadStats()
    } catch (error: any) {
      console.error('Failed to update order:', error)
      alert('Ошибка при обновлении статуса')
    }
  }

  const handleTestNotifications = async () => {
    try {
      setTestingNotifications(true)
      const result = await api.testNotifications()
      alert(`Уведомления отправлены: ${result.sent} успешно, ${result.failed} ошибок из ${result.total}`)
    } catch (error: any) {
      console.error('Failed to test notifications:', error)
      alert('Ошибка при тестировании уведомлений')
    } finally {
      setTestingNotifications(false)
    }
  }

  const handleClearOrders = async () => {
    if (clearConfirm !== 'DELETE') {
      alert('Введите DELETE для подтверждения')
      return
    }

    if (!confirm(`Вы уверены, что хотите удалить заказы? Это действие необратимо!`)) {
      return
    }

    try {
      setClearing(true)
      const result = await api.clearOrders(clearMode, clearBeforeDate || undefined)
      alert(`Удалено заказов: ${result.deletedCount}`)
      setClearConfirm('')
      setClearBeforeDate('')
      loadOrders()
      loadStats()
    } catch (error: any) {
      console.error('Failed to clear orders:', error)
      alert('Ошибка при очистке заказов')
    } finally {
      setClearing(false)
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
        color: '#ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          💡 <strong>Важно:</strong> Админы должны нажать <strong>Start</strong> боту в Telegram, чтобы получать уведомления о новых заказах в личку.
        </div>
        <button
          onClick={handleTestNotifications}
          disabled={testingNotifications}
          className="admin-btn-small"
          style={{ marginLeft: 'auto' }}
        >
          {testingNotifications ? 'Отправка...' : '🧪 Тест уведомлений'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Статистика</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Всего заказов</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.totalOrders}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Доход</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.revenue.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Средний чек</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.avgOrderValue.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>По статусам</div>
              <div style={{ fontSize: '14px' }}>
                Новые: {stats.byStatus.new} | В работе: {stats.byStatus.in_progress} | Готовы: {stats.byStatus.done} | Отменены: {stats.byStatus.canceled}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Orders */}
      <div style={{
        marginBottom: '16px',
        padding: '16px',
        backgroundColor: '#2a1a1a',
        borderRadius: '8px',
        border: '1px solid #ff4444',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#ff6666' }}>⚠️ Очистка заказов</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Режим:</label>
            <select
              value={clearMode}
              onChange={(e) => setClearMode(e.target.value as any)}
              className="admin-select"
              style={{ width: '100%', maxWidth: '300px' }}
            >
              <option value="testOnly">Только тестовые (total ≤ 500)</option>
              <option value="beforeDate">До даты</option>
              <option value="all">Все заказы</option>
            </select>
          </div>
          {clearMode === 'beforeDate' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Дата (до которой удалить):</label>
              <input
                type="date"
                value={clearBeforeDate}
                onChange={(e) => setClearBeforeDate(e.target.value)}
                className="admin-search-input"
                style={{ width: '100%', maxWidth: '300px' }}
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Подтверждение (введите DELETE):</label>
            <input
              type="text"
              value={clearConfirm}
              onChange={(e) => setClearConfirm(e.target.value)}
              placeholder="DELETE"
              className="admin-search-input"
              style={{ width: '100%', maxWidth: '300px' }}
            />
          </div>
          <button
            onClick={handleClearOrders}
            disabled={clearing || clearConfirm !== 'DELETE'}
            className="admin-btn-small"
            style={{
              backgroundColor: '#ff4444',
              color: '#fff',
              maxWidth: '200px',
            }}
          >
            {clearing ? 'Удаление...' : '🗑️ Очистить'}
          </button>
        </div>
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

