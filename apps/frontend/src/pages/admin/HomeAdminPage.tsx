import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

export const HomeAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [showBanners, setShowBanners] = useState(true)
  const [showTiles, setShowTiles] = useState(true)
  const [showLab, setShowLab] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await api.getSettings() as { home?: { showBanners?: boolean; showTiles?: boolean; showLab?: boolean } }
      if (data.home) {
        setShowBanners(data.home.showBanners ?? true)
        setShowTiles(data.home.showTiles ?? true)
        setShowLab(data.home.showLab ?? true)
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.patchSettings({
        home: {
          showBanners,
          showTiles,
          showLab,
        },
      })
      alert('Сохранено ✅')
    } catch (error: any) {
      alert('Ошибка при сохранении')
      console.error('Failed to save:', error)
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
        <h2>Настройка главной</h2>
        <button onClick={loadSettings} className="admin-refresh-btn">
          🔄 Обновить
        </button>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Баннеры на главной
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Показывать баннеры
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
              Отображать карусель баннеров в верхней части главной страницы
            </p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showBanners}
              onChange={(e) => setShowBanners(e.target.checked)}
              disabled={saving}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Плитки/категории
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Показывать плитки
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
              Отображать карточки категорий (Ассортимент, LAB и т.д.)
            </p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showTiles}
              onChange={(e) => setShowTiles(e.target.checked)}
              disabled={saving}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Блок LAB на главной
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Показывать LAB
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
              Отображать секцию LAB с информацией о кастомах
            </p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showLab}
              onChange={(e) => setShowLab(e.target.checked)}
              disabled={saving}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="admin-btn admin-btn-primary"
          style={{ width: '100%' }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}



