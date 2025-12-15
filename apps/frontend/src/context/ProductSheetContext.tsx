import React, { createContext, useContext, useState, useCallback } from 'react'

type ProductSheetContextType = {
  isOpen: boolean
  productId: string | null
  openProduct: (id: string) => void
  closeProduct: () => void
}

const ProductSheetContext = createContext<ProductSheetContextType | undefined>(undefined)

export const ProductSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)

  const openProduct = useCallback((id: string) => {
    setProductId(id)
    setIsOpen(true)
  }, [])

  const closeProduct = useCallback(() => {
    setIsOpen(false)
    // Не очищаем productId сразу, чтобы анимация закрытия работала плавно
    setTimeout(() => setProductId(null), 300)
  }, [])

  return (
    <ProductSheetContext.Provider value={{ isOpen, productId, openProduct, closeProduct }}>
      {children}
    </ProductSheetContext.Provider>
  )
}

export const useProductSheet = () => {
  const context = useContext(ProductSheetContext)
  if (!context) {
    throw new Error('useProductSheet must be used within ProductSheetProvider')
  }
  return context
}

