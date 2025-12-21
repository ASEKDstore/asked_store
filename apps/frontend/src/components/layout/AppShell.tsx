import React, { useEffect, useRef } from 'react'
import { useTgViewport } from '../../hooks/useTgViewport'
import './AppShell.css'

interface AppShellProps {
  header?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Unified App Shell component
 * Provides consistent layout structure for all pages:
 * - Flex column layout
 * - Header (optional, fixed height)
 * - Main content (scrollable)
 * - Footer (sticky, not fixed)
 * - Safe area padding
 * - Telegram viewport height management
 */
export const AppShell: React.FC<AppShellProps> = ({
  header,
  footer,
  children,
  className = '',
}) => {
  const footerRef = useRef<HTMLElement>(null)

  // Initialize Telegram viewport height
  useTgViewport()

  // Measure footer height and update CSS variable
  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        const height = footerRef.current.getBoundingClientRect().height
        if (height > 0) {
          document.documentElement.style.setProperty('--footer-h', `${height}px`)
        }
      }
    }

    updateFooterHeight()

    // Use ResizeObserver to track footer height changes
    if (footerRef.current) {
      const resizeObserver = new ResizeObserver(updateFooterHeight)
      resizeObserver.observe(footerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [footer])

  return (
    <div className={`app-shell ${className}`}>
      {header && <header className="app-shell-header">{header}</header>}
      <main className="app-shell-main">{children}</main>
      {footer && (
        <footer ref={footerRef} className="app-shell-footer">
          {footer}
        </footer>
      )}
    </div>
  )
}

