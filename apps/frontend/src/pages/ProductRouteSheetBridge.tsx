import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useProductSheet } from '../context/ProductSheetContext'

export default function ProductRouteSheetBridge() {
  const { id } = useParams<{ id: string }>()
  const { openProduct, isOpen, productId } = useProductSheet()
  const navigate = useNavigate()
  const location = useLocation()

  // Запоминаем откуда пришли (если есть)
  const cameFromRef = useRef<string | null>(null)

  useEffect(() => {
    if (!cameFromRef.current) {
      // Если есть state.from — используем, иначе null
      const from = (location.state as any)?.from as string | undefined
      cameFromRef.current = from || null
    }
  }, [location.state])

  // Открываем sheet при заходе на /app/product/:id
  useEffect(() => {
    if (!id) return
    openProduct(id)
  }, [id, openProduct])

  // Если sheet закрыли — уходим назад
  useEffect(() => {
    if (!id) return

    // Если мы на /app/product/:id и sheet закрыт (productId обнулён) -> вернуть назад
    // Проверяем через небольшую задержку, чтобы дать время setTimeout в closeProduct
    if (!isOpen && productId === null) {
      const timer = setTimeout(() => {
        if (cameFromRef.current) {
          navigate(cameFromRef.current, { replace: true })
        } else {
          // Пытаемся вернуться назад, если history пустая — идём на /app
          const canGoBack = window.history.length > 1
          if (canGoBack) {
            navigate(-1)
          } else {
            navigate('/app', { replace: true })
          }
        }
      }, 100) // Небольшая задержка для синхронизации с setTimeout в closeProduct

      return () => clearTimeout(timer)
    }
  }, [isOpen, productId, navigate, id])

  // НИЧЕГО не рисуем — sheet рисуется провайдером
  return null
}
