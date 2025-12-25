import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ModalPortalProps = {
  children: React.ReactNode
  isOpen: boolean
}

/**
 * Portal для рендеринга модалок вне DOM-дерева
 * Использует document.body для правильного stacking context
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !isOpen) return null

  return createPortal(children, document.body)
}

