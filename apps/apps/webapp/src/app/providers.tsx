import { ReactNode } from 'react'
import { Router } from './router'

interface ProvidersProps {
  children?: ReactNode
}

/**
 * Провайдеры приложения
 */
export function Providers({ children }: ProvidersProps) {
  return <Router />
}