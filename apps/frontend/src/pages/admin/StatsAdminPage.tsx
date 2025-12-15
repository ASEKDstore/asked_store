import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

type Stats = {
  ordersCount: number
  revenue: number
  avgCheck: number
  topProducts: Array<{ productId: string; title: string; qty: number; revenue: number }>
  statusBreakdown: { new: number; in_progress: number; done: number; canceled: number }
  promoUsage: Array<{ code: string; usedCount: number }>
}

export const StatsAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    loadStats()
  }, [from, to])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.getStats({
        from: from || undefined,
        to: to || undefined,
      })
      setStats(data)
    } catch (error: any) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Загрузка...</div>
  }

  if (!stats) {
    return <div className="admin-empty">Нет данных</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Статистика</h2>
        <button onClick={loadStats} className="admin-refresh-btn">
          🔄 Обновить
        </button>
      </div>

      <div className="admin-filters">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px' }}>От:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="admin-search-input"
            style={{ width: 'auto' }}
          />
          <label style={{ fontSize: '14px' }}>До:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="admin-search-input"
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Заказов</div>
          <div className="admin-stat-value">{stats.ordersCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Выручка</div>
          <div className="admin-stat-value">{stats.revenue.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Средний чек</div>
          <div className="admin-stat-value">{stats.avgCheck.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Топ товаров</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Кол-во</th>
                  <th>Выручка</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, idx) => (
                  <tr key={idx}>
                    <td>{product.title}</td>
                    <td>{product.qty}</td>
                    <td>{product.revenue.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Статусы заказов</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Новые</td>
                  <td>{stats.statusBreakdown.new}</td>
                </tr>
                <tr>
                  <td>В работе</td>
                  <td>{stats.statusBreakdown.in_progress}</td>
                </tr>
                <tr>
                  <td>Готовы</td>
                  <td>{stats.statusBreakdown.done}</td>
                </tr>
                <tr>
                  <td>Отменены</td>
                  <td>{stats.statusBreakdown.canceled}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>Использование промокодов</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Использовано</th>
                </tr>
              </thead>
              <tbody>
                {stats.promoUsage.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', opacity: 0.6 }}>
                      Нет данных
                    </td>
                  </tr>
                ) : (
                  stats.promoUsage.map((promo, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace' }}>{promo.code}</td>
                      <td>{promo.usedCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}



