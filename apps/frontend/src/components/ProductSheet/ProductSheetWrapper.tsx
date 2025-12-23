import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ProductSheet } from './ProductSheet'
import { useProductSheet } from '../../context/ProductSheetContext'
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton'
import { pushLayer, popLayer } from '../../shared/layerManager'

export const ProductSheetWrapper = () => {
  const { isOpen, productId, closeProduct } = useProductSheet()
  const navigate = useNavigate()
  const location = useLocation()
  const previousPathRef = useRef<string>('/app')
  const isNavigatingRef = useRef(false)

  // Layer management: управление scroll-lock через LayerManager
  useEffect(() => {
    const isSheetOpen = isOpen && productId !== null
    if (isSheetOpen) {
      pushLayer('ProductSheetWrapper')
    } else {
      popLayer('ProductSheetWrapper')
    }
    return () => {
      popLayer('ProductSheetWrapper')
    }
  }, [isOpen, productId])

  // Сохраняем предыдущий путь (если не product route и не banner route)
  // Исключаем /app/banner/:id из логики sheet, чтобы не закрывать sheet при переходе на баннер
  useEffect(() => {
    if (!location.pathname.startsWith('/app/product/') && !location.pathname.startsWith('/app/banner/')) {
      previousPathRef.current = location.pathname
    }
  }, [location.pathname])

  // Синхронизация URL при открытии/закрытии sheet
  useEffect(() => {
    if (isNavigatingRef.current) return

    if (isOpen && productId) {
      const targetPath = `/app/product/${productId}`
      if (location.pathname !== targetPath) {
        console.log('[SHEET] Syncing URL to:', targetPath)
        isNavigatingRef.current = true
        navigate(targetPath, { replace: true })
        setTimeout(() => {
          isNavigatingRef.current = false
        }, 100)
      }
      } else if (!isOpen && productId === null && location.pathname.startsWith('/app/product/')) {
        // Исключаем /app/banner/:id из возврата - не возвращаемся на баннер, если он был previousPath
        const targetPath = previousPathRef.current && !previousPathRef.current.startsWith('/app/banner/')
          ? previousPathRef.current
          : '/app'
        if (location.pathname !== targetPath) {
          console.log('[SHEET] Syncing URL back to:', targetPath)
          isNavigatingRef.current = true
          navigate(targetPath, { replace: true })
          setTimeout(() => {
            isNavigatingRef.current = false
          }, 100)
        }
      }
  }, [isOpen, productId, location.pathname, navigate])

  // Show Telegram BackButton when sheet is open
  useTelegramBackButton(() => {
    closeProduct()
  }, isOpen && productId !== null)

  // ВСЕГДА рендерим ProductSheet, даже если productId null
  // ProductSheet сам обработает состояние через isOpen и productId
  // Это гарантирует, что компонент всегда смонтирован и не ломает навигацию
  return (
    <ProductSheet
      productId={productId || ''}
      isOpen={isOpen && productId !== null}
      onClose={closeProduct}
    />
  )
}

