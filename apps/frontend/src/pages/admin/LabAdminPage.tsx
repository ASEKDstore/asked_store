import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

type LabArtist = {
  id: string
  name: string
  avatar?: string
  bio: string
  links: Array<{ title: string; url: string }>
  currentWork?: string // "Сейчас в работе" - над чем работает художник
  active: boolean
  createdAt: string
  updatedAt: string
}

type LabProduct = {
  id: string
  artistId: string
  title: string
  description: string
  price: number
  images: string[]
  tags: string[]
  available: boolean
  createdAt: string
  updatedAt: string
}

type Tab = 'artists' | 'products'

export const LabAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [activeTab, setActiveTab] = useState<Tab>('artists')
  const [artists, setArtists] = useState<LabArtist[]>([])
  const [products, setProducts] = useState<LabProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArtist, setEditingArtist] = useState<LabArtist | null>(null)
  const [editingProduct, setEditingProduct] = useState<LabProduct | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      // Always load artists (needed for product editor)
      const artistsData = await api.getLabArtists() as LabArtist[]
      setArtists(artistsData)
      
      if (activeTab === 'artists') {
        // Artists already loaded
      } else {
        const productsData = await api.getLabProducts() as LabProduct[]
        setProducts(productsData)
      }
    } catch (error: any) {
      console.error('Failed to load LAB data:', error)
      alert('Ошибка при загрузке данных: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArtist = async (id: string) => {
    if (!confirm('Удалить художника?')) return
    try {
      await api.deleteLabArtist(id)
      loadData()
    } catch (error: any) {
      alert('Ошибка при удалении: ' + (error.message || 'Unknown error'))
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Удалить LAB-товар?')) return
    try {
      await api.deleteLabProduct(id)
      loadData()
    } catch (error: any) {
      alert('Ошибка при удалении: ' + (error.message || 'Unknown error'))
    }
  }

  const handleSaveArtist = async (data: Partial<LabArtist>) => {
    try {
      if (editingArtist) {
        await api.updateLabArtist(editingArtist.id, data)
      } else {
        await api.createLabArtist(data)
      }
      setShowModal(false)
      setEditingArtist(null)
      loadData()
    } catch (error: any) {
      alert('Ошибка при сохранении: ' + (error.message || 'Unknown error'))
    }
  }

  const handleSaveProduct = async (data: Partial<LabProduct>) => {
    try {
      if (editingProduct) {
        await api.updateLabProduct(editingProduct.id, data)
      } else {
        await api.createLabProduct(data)
      }
      setShowModal(false)
      setEditingProduct(null)
      loadData()
    } catch (error: any) {
      alert('Ошибка при сохранении: ' + (error.message || 'Unknown error'))
    }
  }

  const getArtistName = (artistId: string) => {
    const artist = artists.find(a => a.id === artistId)
    return artist?.name || artistId
  }

  if (loading) {
    return <div className="admin-page-loading">Загрузка...</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>LAB</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`admin-btn ${activeTab === 'artists' ? 'admin-btn-primary' : ''}`}
            onClick={() => setActiveTab('artists')}
          >
            🎨 Художники
          </button>
          <button
            className={`admin-btn ${activeTab === 'products' ? 'admin-btn-primary' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            🧪 LAB товары
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => {
              if (activeTab === 'artists') {
                setEditingArtist(null)
              } else {
                setEditingProduct(null)
              }
              setShowModal(true)
            }}
          >
            + {activeTab === 'artists' ? 'Добавить художника' : 'Добавить LAB товар'}
          </button>
        </div>
      </div>

      {showModal && activeTab === 'artists' && (
        <ArtistModal
          artist={editingArtist}
          onSave={handleSaveArtist}
          onClose={() => {
            setShowModal(false)
            setEditingArtist(null)
          }}
        />
      )}

      {showModal && activeTab === 'products' && (
        <ProductModal
          product={editingProduct}
          artists={artists}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
        />
      )}

      {activeTab === 'artists' ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Активен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {artists.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '32px' }}>
                    Художников пока нет
                  </td>
                </tr>
              ) : (
                artists.map(artist => (
                  <tr key={artist.id}>
                    <td>
                      <strong>{artist.name}</strong>
                    </td>
                    <td>{artist.active ? '✅' : '❌'}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-small"
                          onClick={() => {
                            setEditingArtist(artist)
                            setShowModal(true)
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="admin-btn admin-btn-small admin-btn-danger"
                          onClick={() => handleDeleteArtist(artist.id)}
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
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Художник</th>
                <th>Цена</th>
                <th>Доступен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                    LAB-товаров пока нет
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.title}</strong>
                    </td>
                    <td>{getArtistName(product.artistId)}</td>
                    <td>{product.price.toLocaleString('ru-RU')} ₽</td>
                    <td>{product.available ? '✅' : '❌'}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-small"
                          onClick={() => {
                            setEditingProduct(product)
                            setShowModal(true)
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="admin-btn admin-btn-small admin-btn-danger"
                          onClick={() => handleDeleteProduct(product.id)}
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
      )}
    </div>
  )
}

const ArtistModal: React.FC<{
  artist: LabArtist | null
  onSave: (data: Partial<LabArtist>) => void
  onClose: () => void
}> = ({ artist, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<LabArtist>>({
    name: artist?.name || '',
    bio: artist?.bio || '',
    currentWork: artist?.currentWork || '',
    links: artist?.links || [],
    active: artist?.active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.bio) {
      alert('Заполните обязательные поля: имя и биография')
      return
    }
    onSave(formData)
  }

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...(formData.links || []), { title: '', url: '' }],
    })
  }

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...(formData.links || [])]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setFormData({ ...formData, links: newLinks })
  }

  const removeLink = (index: number) => {
    const newLinks = [...(formData.links || [])]
    newLinks.splice(index, 1)
    setFormData({ ...formData, links: newLinks })
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{artist ? 'Редактировать художника' : 'Добавить художника'}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label>Имя *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Сейчас в работе (опционально)</label>
              <textarea
                value={formData.currentWork || ''}
                onChange={(e) => setFormData({ ...formData, currentWork: e.target.value })}
                placeholder="Над чем сейчас работает художник..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f5f5f5', fontFamily: 'inherit', fontSize: '14px' }}
              />
            </div>

            <div className="admin-form-group">
              <label>Биография *</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={6}
                required
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f5f5f5', fontFamily: 'inherit', fontSize: '14px' }}
              />
            </div>

            <div className="admin-form-group">
              <label>
                Ссылки
                <button type="button" onClick={addLink} style={{ marginLeft: '8px', fontSize: '12px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#f5f5f5', cursor: 'pointer' }}>
                  + Добавить
                </button>
              </label>
              {(formData.links || []).map((link, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Название"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="admin-btn admin-btn-small admin-btn-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
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

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">
                Сохранить
              </button>
              <button type="button" className="admin-btn" onClick={onClose}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const ProductModal: React.FC<{
  product: LabProduct | null
  artists: LabArtist[]
  onSave: (data: Partial<LabProduct>) => void
  onClose: () => void
}> = ({ product, artists, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<LabProduct>>({
    artistId: product?.artistId || '',
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    images: product?.images || [],
    tags: product?.tags || [],
    available: product?.available ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.artistId || !formData.title || formData.price === undefined) {
      alert('Заполните обязательные поля: художник, название, цена')
      return
    }
    onSave(formData)
  }

  const addImage = () => {
    setFormData({
      ...formData,
      images: [...(formData.images || []), ''],
    })
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...(formData.images || [])]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])]
    newImages.splice(index, 1)
    setFormData({ ...formData, images: newImages })
  }

  const addTag = () => {
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), ''],
    })
  }

  const updateTag = (index: number, value: string) => {
    const newTags = [...(formData.tags || [])]
    newTags[index] = value
    setFormData({ ...formData, tags: newTags })
  }

  const removeTag = (index: number) => {
    const newTags = [...(formData.tags || [])]
    newTags.splice(index, 1)
    setFormData({ ...formData, tags: newTags })
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{product ? 'Редактировать LAB товар' : 'Добавить LAB товар'}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label>Художник *</label>
              <select
                value={formData.artistId}
                onChange={(e) => setFormData({ ...formData, artistId: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f5f5f5', fontFamily: 'inherit', fontSize: '14px' }}
              >
                <option value="">Выберите художника</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label>Название *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f5f5f5', fontFamily: 'inherit', fontSize: '14px' }}
              />
            </div>

            <div className="admin-form-group">
              <label>Цена *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                required
                min="0"
              />
            </div>

            <div className="admin-form-group">
              <label>
                Изображения (URL)
                <button type="button" onClick={addImage} style={{ marginLeft: '8px', fontSize: '12px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#f5f5f5', cursor: 'pointer' }}>
                  + Добавить
                </button>
              </label>
              {(formData.images || []).map((image, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="URL изображения"
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="admin-btn admin-btn-small admin-btn-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="admin-form-group">
              <label>
                Теги
                <button type="button" onClick={addTag} style={{ marginLeft: '8px', fontSize: '12px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#f5f5f5', cursor: 'pointer' }}>
                  + Добавить
                </button>
              </label>
              {(formData.tags || []).map((tag, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Тег"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="admin-btn admin-btn-small admin-btn-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="admin-form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.available ?? true}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                />
                Доступен
              </label>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">
                Сохранить
              </button>
              <button type="button" className="admin-btn" onClick={onClose}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
