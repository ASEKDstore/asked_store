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
 * Unified App Shell component (Foundation)
 * Provides consistent layout structure for all WebApp pages:
 * - Flex column layout with fixed header
 * - Single scroll container for content (.app-content)
 * - Predictable height via 100dvh and safe-area
 * - NO global body overflow: hidden
 * - Telegram viewport height management
 */
export const AppShell: React.FC<AppShellProps> = ({
  header,
  footer,
  children,
  className = '',
}) => {
  const contentRef = useRef<HTMLElement>(null)
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
      {header && <div className="app-header">{header}</div>}
      <main ref={contentRef} className="app-content">
        {children}
      </main>
      {footer && (
        <footer ref={footerRef} className="app-footer">
          {footer}
        </footer>
      )}
    </div>
  )
}

