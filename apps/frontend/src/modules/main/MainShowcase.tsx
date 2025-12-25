import React, { useEffect, useState } from 'react'
import { useProductSheet } from '../../context/ProductSheetContext'
import { getUIProducts } from '../../api/productsApi'
import { ProductShowcaseCarousel } from '../../components/ProductShowcaseCarousel'
import './MainShowcase.css'

/**
 * Блок 8: Витрина товаров (Showcase)
 * Изолированный компонент для отображения витрины товаров
 */
export const MainShowcase: React.FC = () => {
  const { openProduct } = useProductSheet()
  const [productsToShow, setProductsToShow] = useState<any[]>([])

  // Load products from API with abort controller
  useEffect(() => {
    const abortController = new AbortController()
    
    const loadProducts = async () => {
      try {
        const products = await getUIProducts({ sort: 'newest' })
        if (!abortController.signal.aborted) {
          setProductsToShow(products.slice(0, 6))
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Failed to load products:', error)
          setProductsToShow([])
        }
      }
    }
    loadProducts()
    
    return () => {
      abortController.abort()
    }
  }, [])

  const handleProductOpen = (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[MainShowcase] Cannot open: product id is missing')
      }
      return
    }
    openProduct(id)
  }

  return (
    <div className="main-block main-block-showcase">
      <section className="home-showcase">
        <div className="showcase-head">
          <div className="showcase-kicker">DROP NOW</div>
          <h2 className="showcase-title">Витрина товаров</h2>
          <p className="showcase-sub">Выбирай из актуального. Центральная карточка — в фокусе.</p>
        </div>

        {productsToShow.length > 0 ? (
          <ProductShowcaseCarousel 
            products={productsToShow} 
            onOpen={handleProductOpen} 
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.7 }}>
            <p>Скоро дроп</p>
          </div>
        )}
      </section>
    </div>
  )
}

