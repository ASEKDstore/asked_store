import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useProductSheet } from '../../context/ProductSheetContext'

/**
 * Компонент для обработки deep links /app/product/:id
 * Открывает ProductSheet при заходе на этот URL
 * НЕ возвращает null - всегда рендерит пустой div для стабильности роутинга
 */
export const ProductRouteHandler = () => {
  // ✅ ВСЕ хуки вызываются ВСЕГДА, до любого return
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { openProduct, isOpen, productId } = useProductSheet()
  const previousPathRef = useRef<string | null>(null)
  const didRunRef = useRef(false)

  // ✅ useEffect вызывается ВСЕГДА
  // Запоминаем предыдущий путь ОДИН РАЗ, если пришли не с /app/product/*
  // Исключаем /app/banner/:id из логики sheet
  useEffect(() => {
    if (!previousPathRef.current) {
      const path = location.pathname
      if (!path.startsWith('/app/product/') && !path.startsWith('/app/banner/')) {
        previousPathRef.current = path
      }
    }
  }, [location.pathname])

  // ✅ useEffect вызывается ВСЕГДА
  // Открываем sheet при заходе на /app/product/:id (с guard для StrictMode)
  useEffect(() => {
    if (!id) return
    if (didRunRef.current) return
    didRunRef.current = true
    
    console.log('[SHEET] Opening product from route:', id)
    openProduct(id)
    
    // Сбрасываем guard после небольшой задержки
    const timer = setTimeout(() => {
      didRunRef.current = false
    }, 500)
    
    return () => clearTimeout(timer)
  }, [id, openProduct])

  // ✅ useEffect вызывается ВСЕГДА
  // Если sheet закрыли и мы на /app/product/:id - возвращаемся назад
  useEffect(() => {
    if (!id) return
    if (location.pathname.startsWith('/app/product/') && !isOpen && productId === null) {
      const timer = setTimeout(() => {
        console.log('[SHEET] Closing, navigating back to:', previousPathRef.current)
        const targetPath = previousPathRef.current || '/app'
        if (location.pathname !== targetPath) {
          navigate(targetPath, { replace: true })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [id, isOpen, productId, location.pathname, navigate])

  // ✅ useEffect вызывается ВСЕГДА
  // Диагностика
  useEffect(() => {
    console.log('[SHEET]', { isOpen, productId, path: location.pathname, routeId: id })
  }, [isOpen, productId, location.pathname, id])

  // ✅ Никогда не return null - хотя бы пустой div
  return <div style={{ display: 'none' }} />
}

