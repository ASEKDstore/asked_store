import { useEffect, useRef } from 'react'

/**
 * Hook to log component re-renders in development mode
 * Only logs if VITE_LOG_RENDERS env variable is set
 * Usage: useRenderLog('ComponentName')
 */
export function useRenderLog(componentName: string, props?: Record<string, any>) {
  const renderCountRef = useRef(0)
  const prevPropsRef = useRef<any>(props)

  useEffect(() => {
    if (import.meta.env.DEV && import.meta.env.VITE_LOG_RENDERS === 'true') {
      renderCountRef.current += 1
      
      // Log only if props changed or it's the first render
      if (renderCountRef.current === 1 || JSON.stringify(props) !== JSON.stringify(prevPropsRef.current)) {
        console.log(`[RENDER] ${componentName} #${renderCountRef.current}`, {
          props: props ? Object.keys(props) : undefined,
        })
      }
      
      prevPropsRef.current = props
    }
  })
}

