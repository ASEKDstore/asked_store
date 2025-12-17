import { ReactNode } from 'react'
import './RouteTransitionWrapper.css'

interface RouteTransitionWrapperProps {
  children: ReactNode
}

/**
 * Wrapper component for smooth route transitions
 * Uses CSS fade-in animation (no framer-motion dependency)
 * Simple fade-in on mount for each route change
 */
export function RouteTransitionWrapper({ children }: RouteTransitionWrapperProps) {
  return (
    <div className="route-transition">
      {children}
    </div>
  )
}

