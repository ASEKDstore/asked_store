import { useState, useEffect, useMemo, useRef } from 'react'
import { products } from '../data/products'
import { ProductGridCard } from '../modules/products/ProductGridCard'
import type { Product } from '../data/products'
import './catalog.css'

export const CatalogPage = () => {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Product['category']>('all')
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

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Поиск по query
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.article.toLowerCase().includes(q)
      )
    }

    // Фильтр по категории
    if (category !== 'all') {
      filtered = filtered.filter((p) => p.category === category)
    }

    // Фильтр "В наличии"
    if (onlyAvailable) {
      filtered = filtered.filter((p) => p.available)
    }

    // Сортировка
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        // Заглушка - просто обратный порядок
        filtered.reverse()
        break
      case 'popular':
      default:
        // Заглушка - исходный порядок
        break
    }

    return filtered
  }, [query, category, onlyAvailable, sort])

  // Вычисление максимально допустимых колонок на основе ширины
  const maxAllowed =
    wrapW < 560 ? 1 : wrapW < 920 ? 2 : 3

  // Эффективное количество колонок
  const effectiveCols = Math.min(gridCols, maxAllowed)

  const categories: Array<{ value: 'all' | Product['category']; label: string }> = [
    { value: 'all', label: 'Все' },
    { value: 'hoodie', label: 'Худи' },
    { value: 'tshirt', label: 'Футболки' },
    { value: 'pants', label: 'Брюки' },
    { value: 'custom', label: 'Кастом' },
    { value: 'accessories', label: 'Аксессуары' },
    { value: 'headwear', label: 'Головные уборы' },
  ]

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
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`catalog-category-chip ${category === cat.value ? 'active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
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
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductGridCard key={product.id} product={product} />
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
