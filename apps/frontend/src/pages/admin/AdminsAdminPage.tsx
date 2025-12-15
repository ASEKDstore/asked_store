import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import { ROOT_ADMIN_ID } from '../../config/admins'
import './AdminPages.css'

export const AdminsAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [admins, setAdmins] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [newTgId, setNewTgId] = useState('')

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await api.getAdmins() as number[]
      setAdmins(data)
    } catch (error: any) {
      console.error('Failed to load admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    const tgId = parseInt(newTgId, 10)
    if (isNaN(tgId)) {
      alert('Неверный Telegram ID')
      return
    }

    try {
      await api.addAdmin(tgId)
      setNewTgId('')
      loadAdmins()
    } catch (error: any) {
      alert('Ошибка при добавлении: ' + (error.message || 'Неизвестная ошибка'))
    }
  }

  const handleRemove = async (tgId: number) => {
    if (tgId === ROOT_ADMIN_ID) {
      alert('Нельзя удалить root админа')
      return
    }

    if (!confirm(`Удалить админа ${tgId}?`)) return

    try {
      await api.removeAdmin(tgId)
      loadAdmins()
    } catch (error: any) {
      alert('Ошибка при удалении: ' + (error.message || 'Неизвестная ошибка'))
    }
  }

  if (loading) {
    return <div className="admin-loading">Загрузка...</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Администраторы</h2>
        <button onClick={loadAdmins} className="admin-refresh-btn">
          🔄 Обновить
        </button>
      </div>

      <div className="admin-filters">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Telegram ID"
            value={newTgId}
            onChange={(e) => setNewTgId(e.target.value)}
            className="admin-search-input"
            style={{ width: '200px' }}
          />
          <button onClick={handleAdd} className="admin-btn-primary">
            Добавить админа
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Telegram ID</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(tgId => (
              <tr key={tgId}>
                <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{tgId}</td>
                <td>{tgId === ROOT_ADMIN_ID ? 'Root Admin' : 'Admin'}</td>
                <td>
                  {tgId !== ROOT_ADMIN_ID && (
                    <button
                      className="admin-btn-small"
                      onClick={() => handleRemove(tgId)}
                      style={{ background: 'rgba(255, 0, 0, 0.2)', borderColor: 'rgba(255, 0, 0, 0.3)' }}
                    >
                      Удалить
                    </button>
                  )}
                  {tgId === ROOT_ADMIN_ID && (
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>Нельзя удалить</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

