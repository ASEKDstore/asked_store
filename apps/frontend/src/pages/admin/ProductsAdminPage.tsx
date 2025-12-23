import { useState, useEffect, useMemo } from 'react'
import { useProductsStore } from '../../store/productsStore'
import { ProductAdminSheet } from '../../components/ProductAdminSheet'
import { useTgId, isAdmin } from '../../hooks/useTgId'
import type { Product, ProductStatus } from '../../types/adminProduct'
import './AdminPages.css'
import './ProductsAdminPage.css'

type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc'
type StatusFilter = 'all' | 'draft' | 'published'

export const ProductsAdminPage: React.FC = () => {
  // ✅ ВСЕ хуки вызываются ВСЕГДА
  const tgId = useTgId()
  const admin = isAdmin(tgId)
  const store = useProductsStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined)

  // Hydrate при монтировании
  useEffect(() => {
    store.hydrate()
  }, [store])

  // Фильтрация и сортировка
  const filteredAndSorted = useMemo(() => {
    let filtered = store.items

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Сортировка
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdAt - a.createdAt
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        default:
          return 0
      }
    })

    return sorted
  }, [store.items, searchQuery, statusFilter, sort])

  const handleCreate = () => {
    setSheetMode('create')
    setEditingProductId(undefined)
  }

  const handleEdit = (id: string) => {
    setSheetMode('edit')
    setEditingProductId(id)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Удалить товар? Это действие нельзя отменить.')) {
      store.deleteProduct(id)
    }
  }

  const handleSheetClose = () => {
    setSheetMode(null)
    setEditingProductId(undefined)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // ✅ НЕ возвращаем null - показываем экран "Нет доступа"
  if (!admin) {
    return (
      <div className="admin-page">
        <div className="admin-no-access">
          <div className="admin-no-access-icon">🔒</div>
          <div className="admin-no-access-title">Нет доступа</div>
          <div className="admin-no-access-text">У вас нет прав для просмотра этой страницы.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Товары</h2>
        <button className="admin-btn-primary" onClick={handleCreate}>
          + Новый товар
        </button>
      </div>

      {/* Фильтры */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="Поиск по названию или тегам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-search-input"
        />
        <div className="admin-filters-row">
          <div className="admin-chips">
            <button
              className={`admin-chip ${statusFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Все
            </button>
            <button
              className={`admin-chip ${statusFilter === 'draft' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('draft')}
            >
              Черновики
            </button>
            <button
              className={`admin-chip ${statusFilter === 'published' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('published')}
            >
              Опубликованные
            </button>
          </div>
          <select
            className="admin-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            <option value="newest">Новые</option>
            <option value="oldest">Старые</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
          </select>
        </div>
      </div>

      {/* Список товаров */}
      {filteredAndSorted.length === 0 ? (
        <div className="admin-empty">
          {searchQuery || statusFilter !== 'all' ? 'Товаров не найдено' : 'Товаров пока нет'}
        </div>
      ) : (
        <div className="products-admin-grid">
          {filteredAndSorted.map((product) => (
            <div key={product.id} className="products-admin-card">
              <div className="products-admin-card-image">
                <img
                  src={(product.images && product.images[0]) || '/assets/placeholder-product.jpg'}
                  alt={product.title ?? 'Товар'}
                  loading="lazy"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/assets/placeholder-product.jpg'
                  }}
                />
                <div className={`products-admin-card-status ${product.status ?? 'draft'}`}>
                  {product.status === 'published' ? 'Опубликован' : 'Черновик'}
                </div>
              </div>
              <div className="products-admin-card-content">
                <div className="products-admin-card-article">{product.article ?? ''}</div>
                <div className="products-admin-card-title">{product.title ?? 'Без названия'}</div>
                <div className="products-admin-card-price">
                  {product.price.toLocaleString('ru-RU')} ₽
                  {product.oldPrice && (
                    <span className="products-admin-card-oldprice">
                      {product.oldPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </div>
                <div className="products-admin-card-meta">
                  {formatDate(product.createdAt)}
                </div>
                <div className="products-admin-card-actions">
                  <button
                    className="admin-btn-small"
                    onClick={() => handleEdit(product.id)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="admin-btn-small admin-btn-danger"
                    onClick={() => handleDelete(product.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Admin Sheet */}
      {sheetMode && (
        <ProductAdminSheet
          isOpen={true}
          mode={sheetMode}
          productId={editingProductId}
          onClose={handleSheetClose}
          onSaved={() => {
            // Sheet сам закроется
          }}
          onDeleted={() => {
            // Sheet сам закроется
          }}
        />
      )}
    </div>
  )
}
