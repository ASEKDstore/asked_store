import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

type Banner = {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  ctaText?: string
  detailsImage?: string
  active?: boolean
  order?: number
  createdAt: string
  updatedAt: string
}

export const BannersAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const data = await api.getBanners() as Banner[]
      setBanners(data)
    } catch (error: any) {
      console.error('Failed to load banners:', error)
      alert('Ошибка при загрузке данных: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить баннер?')) return
    try {
      await api.deleteBanner(id)
      loadBanners()
    } catch (error: any) {
      alert('Ошибка при удалении: ' + (error.message || 'Unknown error'))
    }
  }

  const handleSave = async (bannerData: Partial<Banner>) => {
    try {
      // Нормализация payload ПЕРЕД отправкой (приводим к серверному контракту)
      const payload = {
        title: String(bannerData.title ?? '').trim(),
        subtitle: bannerData.subtitle ? String(bannerData.subtitle).trim() : undefined,
        description: String(bannerData.description ?? '').trim(), // Гарантируем строку
        image: String(bannerData.image ?? '').trim(), // Используем image, не imageUrl
        detailsImage: bannerData.detailsImage ? String(bannerData.detailsImage).trim() : undefined, // Используем detailsImage, не detailsImageUrl
        ctaText: bannerData.ctaText ? String(bannerData.ctaText).trim() : undefined, // Используем ctaText, не buttonText
        order: Number.isFinite(Number(bannerData.order)) ? Number(bannerData.order) : 0,
        active: Boolean(bannerData.active),
      }

      // Валидация обязательных полей
      if (!payload.title) {
        alert('Заголовок обязателен')
        return
      }
      if (!payload.description) {
        alert('Описание обязательно')
        return
      }
      if (!payload.image) {
        alert('Изображение обязательно')
        return
      }

      if (editingBanner) {
        await api.updateBanner(editingBanner.id, payload)
      } else {
        await api.createBanner(payload)
      }
      setShowEditor(false)
      setEditingBanner(null)
      setErrorMessage(null)
      loadBanners()
    } catch (error: any) {
      // Ошибка уже логируется в adminApi с полными деталями
      const message = error.message || 'Неизвестная ошибка'
      setErrorMessage(message)
      
      // Показываем понятное сообщение пользователю
      // Если это сетевая ошибка - показываем "Network error"
      if (message.includes('Network error') || message.includes('Failed to fetch')) {
        alert('Ошибка сети: не удалось подключиться к серверу. Проверьте, что сервер запущен.')
      } else {
        // Показываем ошибку от сервера
        alert(`Ошибка при сохранении: ${message}`)
      }
    }
  }

  if (loading) {
    return <div className="admin-page-loading">Загрузка...</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Баннеры</h2>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setEditingBanner(null)
            setShowEditor(true)
          }}
        >
          + Создать баннер
        </button>
      </div>

      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          background: 'rgba(255, 107, 107, 0.15)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          color: '#ff6b6b',
          fontSize: '14px',
        }}>
          {errorMessage}
        </div>
      )}

      {showEditor && (
        <BannerEditor
          banner={editingBanner}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false)
            setEditingBanner(null)
            setErrorMessage(null)
          }}
        />
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Изображение</th>
              <th>Активен</th>
              <th>Порядок</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                  Баннеров пока нет
                </td>
              </tr>
            ) : (
              banners.map(banner => (
                <tr key={banner.id}>
                  <td className="admin-ellipsis" title={banner.id}>{banner.id.slice(0, 8)}...</td>
                  <td>
                    <div>
                      <strong className="admin-ellipsis" title={banner.title}>{banner.title}</strong>
                      {banner.subtitle && (
                        <div style={{ fontSize: '12px', opacity: 0.7 }} className="admin-ellipsis" title={banner.subtitle}>
                          {banner.subtitle}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <img
                      src={banner.image}
                      alt={banner.title}
                      style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/placeholder.jpg'
                      }}
                    />
                  </td>
                  <td>{banner.active ? '✅' : '❌'}</td>
                  <td>{banner.order ?? '-'}</td>
                  <td>
                    <div className="admin-actions-wrap">
                      <button
                        className="admin-btn admin-btn-small"
                        onClick={() => {
                          setEditingBanner(banner)
                          setShowEditor(true)
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="admin-btn admin-btn-small admin-btn-danger"
                        onClick={() => handleDelete(banner.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const BannerEditor: React.FC<{
  banner: Banner | null
  onSave: (data: Partial<Banner>) => void
  onCancel: () => void
}> = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    description: banner?.description || '',
    image: banner?.image || '',
    ctaText: banner?.ctaText || '',
    detailsImage: banner?.detailsImage || '',
    active: banner?.active ?? true,
    order: banner?.order ?? 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Нормализация происходит в handleSave
    onSave(formData)
  }

  return (
    <div className="admin-editor">
      <h3>{banner ? 'Редактировать баннер' : 'Создать баннер'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label>Заголовок *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="admin-form-group">
          <label>Подзаголовок</label>
          <input
            type="text"
            value={formData.subtitle || ''}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          />
        </div>

        <div className="admin-form-group">
          <label>Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
          />
        </div>

        <div className="admin-form-group">
          <label>Изображение (URL) *</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            required
          />
        </div>

        <div className="admin-form-group">
          <label>Изображение деталей (URL)</label>
          <input
            type="text"
            value={formData.detailsImage || ''}
            onChange={(e) => setFormData({ ...formData, detailsImage: e.target.value })}
          />
        </div>

        <div className="admin-form-group">
          <label>Текст кнопки</label>
          <input
            type="text"
            value={formData.ctaText || ''}
            onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
            placeholder="Подробнее"
          />
        </div>

        <div className="admin-form-group">
          <label>Порядок</label>
          <input
            type="number"
            value={formData.order || 0}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="admin-form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.active ?? true}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            />
            Активен
          </label>
        </div>

        <div className="admin-form-actions admin-actions-wrap">
          <button type="submit" className="admin-btn admin-btn-primary">
            Сохранить
          </button>
          <button type="button" className="admin-btn" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

