import { useState, useEffect, useRef, useCallback } from 'react'
import ProductGridCard from '../modules/products/ProductGridCard'
import { getUIProducts, getPublicCategories, type UIProduct, type Category } from '../api/productsApi'
import './catalog.css'

export const CatalogPage = () => {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<UIProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sort, setSort] = useState<'popular' | 'price_asc' | 'price_desc' | 'newest'>('popular')
  const [gridCols, setGridCols] = useState<2 | 3>(() => {
    const v = localStorage.getItem('asked_catalog_cols')
    return v === '2' ? 2 : 3
  })
  const [viewOpen, setViewOpen] = useState(false)
  const gridWrapRef = useRef<HTMLDivElement | null>(null)
  const [wrapW, setWrapW] = useState(0)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getPublicCategories()
        setCategories(cats)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const prods = await getUIProducts({
          categorySlug: selectedCategorySlug || undefined,
          inStock: onlyAvailable || undefined,
          search: query || undefined,
          sort,
        })
        setProducts(prods)
      } catch (error) {
        console.error('Failed to load products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadProducts()
    }, query ? 300 : 0)
    
    return () => clearTimeout(timeoutId)
  }, [selectedCategorySlug, onlyAvailable, query, sort])

  // Сохранение выбора в localStorage
  useEffect(() => {
    localStorage.setItem('asked_catalog_cols', String(gridCols))
  }, [gridCols])

  // ResizeObserver для отслеживания ширины контейнера
  useEffect(() => {
    const el = gridWrapRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0
      setWrapW(w)
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Закрытие меню вида при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.catalog-view')) {
        setViewOpen(false)
      }
    }

    if (viewOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [viewOpen])


  // Вычисление максимально допустимых колонок на основе ширины
  const maxAllowed =
    wrapW < 560 ? 1 : wrapW < 920 ? 2 : 3

  // Эффективное количество колонок
  const effectiveCols = Math.min(gridCols, maxAllowed)


  return (
    <div className={`catalog-page ${mounted ? 'is-mounted' : ''}`}>
      <div className="catalog-header">
        <h1 className="catalog-title">Ассортимент</h1>
      </div>

      <div className="catalog-controls">
        <div className="catalog-search">
          <input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="catalog-search-input"
          />
        </div>

        <div className="catalog-filters">
          <div className="catalog-categories">
            <button
              className={`catalog-category-chip ${selectedCategorySlug === null ? 'active' : ''}`}
              onClick={() => setSelectedCategorySlug(null)}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`catalog-category-chip ${selectedCategorySlug === cat.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategorySlug(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="catalog-controls-row">
            <label className="catalog-checkbox">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              <span>В наличии</span>
            </label>

            <div className="catalog-sort-row">
              <select
                className="catalog-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                <option value="popular">Популярные</option>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="newest">Новинки</option>
              </select>

              <div className={`catalog-view ${viewOpen ? 'open' : ''}`}>
                <button
                  className="catalog-view-btn"
                  onClick={() => setViewOpen((v) => !v)}
                  aria-expanded={viewOpen}
                  type="button"
                >
                  Вид {gridCols} <span className="chev">▾</span>
                </button>

                {viewOpen && (
                  <div className="catalog-view-menu">
                    <button
                      className={`catalog-view-item ${gridCols === 2 ? 'active' : ''}`}
                      onClick={() => {
                        setGridCols(2)
                        setViewOpen(false)
                      }}
                      type="button"
                    >
                      2 в ряд
                    </button>
                    <button
                      className={`catalog-view-item ${gridCols === 3 ? 'active' : ''}`}
                      onClick={() => {
                        setGridCols(3)
                        setViewOpen(false)
                      }}
                      type="button"
                    >
                      3 в ряд
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog-grid-wrap" ref={gridWrapRef}>
        <div
          className="catalog-grid"
          style={{
            gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`,
          }}
        >
          {loading ? (
            <div className="catalog-empty">
              <p>Загрузка...</p>
            </div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductGridCard 
                key={product.id} 
                product={product}
              />
            ))
          ) : (
            <div className="catalog-empty">
              <p>Товары не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
