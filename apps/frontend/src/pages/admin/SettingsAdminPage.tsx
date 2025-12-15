import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

export const SettingsAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await api.getSettings()
      setMaintenanceMode(data.maintenanceMode)
    } catch (error: any) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMaintenance = async () => {
    const newValue = !maintenanceMode
    try {
      setSaving(true)
      await api.patchSettings({ maintenanceMode: newValue })
      setMaintenanceMode(newValue)
    } catch (error: any) {
      alert('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Загрузка...</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Настройки</h2>
        <button onClick={loadSettings} className="admin-refresh-btn">
          🔄 Обновить
        </button>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Режим техработ</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.7 }}>
              При включении обычные пользователи увидят страницу техработ
            </p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={handleToggleMaintenance}
              disabled={saving}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        {maintenanceMode && (
          <div style={{ padding: '12px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
            ⚠️ Режим техработ активен. Администраторы продолжают видеть приложение.
          </div>
        )}
      </div>
    </div>
  )
}



