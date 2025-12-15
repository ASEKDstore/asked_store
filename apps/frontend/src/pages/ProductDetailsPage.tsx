import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useProductSheet } from '../context/ProductSheetContext'

export const ProductDetailsPage = () => {
  const { id } = useParams()
  const { openProduct } = useProductSheet()

  // Deep link: открываем sheet при заходе на /app/product/:id
  useEffect(() => {
    if (id) {
      openProduct(id)
    }
  }, [id, openProduct])

  // Не рендерим ничего - контент в ProductSheet
  return null
}

