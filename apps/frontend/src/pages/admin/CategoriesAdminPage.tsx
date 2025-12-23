import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

type Category = {
  id: string
  name: string
  slug: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export const CategoriesAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', isActive: true, order: 0 })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await api.getCategories() as Category[]
      setCategories(data || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', isActive: true, order: 0 })
    setShowEditor(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      order: category.order,
    })
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Название обязательно')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        isActive: formData.isActive,
        order: formData.order,
      }

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data)
      } else {
        await api.createCategory(data)
      }

      setShowEditor(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить категорию? Это действие нельзя отменить.')) return

    setLoading(true)
    try {
      await api.deleteCategory(id)
      await loadCategories()
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Категории</h2>
        <button onClick={handleCreate} className="admin-btn admin-btn-primary">
          + Создать категорию
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {showEditor && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <h3>{editingCategory ? 'Редактирование' : 'Создание'} категории</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Название</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value
                setFormData({
                  ...formData,
                  name,
                  slug: formData.slug || generateSlug(name),
                })
              }}
              className="admin-input"
              placeholder="Например: POIZON"
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="admin-input"
              placeholder="poizon"
            />
            <small style={{ display: 'block', marginTop: '4px', opacity: 0.7 }}>
              Используется в URL. Только латиница, цифры и дефисы.
            </small>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Активна</span>
            </label>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Порядок</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="admin-input"
            />
          </div>
          <div className="admin-actions-wrap">
            <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={loading}>
              Сохранить
            </button>
            <button
              onClick={() => {
                setShowEditor(false)
                setEditingCategory(null)
                setError(null)
              }}
              className="admin-btn admin-btn-secondary"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading && !showEditor ? (
        <p>Загрузка...</p>
      ) : categories.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>Категории не созданы</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map(category => (
            <div key={category.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {category.name}
                  {!category.isActive && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>(Неактивна)</span>}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Slug: {category.slug} • Порядок: {category.order}
                </div>
              </div>
              <div className="admin-actions-wrap">
                <button onClick={() => handleEdit(category)} className="admin-btn admin-btn-secondary">
                  ✏️ Редактировать
                </button>
                <button onClick={() => handleDelete(category.id)} className="admin-btn admin-btn-secondary">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

