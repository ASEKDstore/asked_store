import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../modules/header/Header'
import { useMaintenanceMode } from '../hooks/useMaintenanceMode'
import { MaintenancePage } from '../pages/MaintenancePage'
import { ProductSheetWrapper } from '../components/ProductSheet/ProductSheetWrapper'
import { ProductRouteHandler } from '../components/ProductSheet/ProductRouteHandler'
import { useProductSheet } from '../context/ProductSheetContext'
import { Footer } from '../components/Footer/Footer'
import { RouteTransitionWrapper } from '../components/RouteTransitionWrapper'
import { BackgroundLayer } from '../components/BackgroundLayer'
import { useSwipeBack } from '../hooks/useSwipeBack'
import { useUser } from '../context/UserContext'
import { useTelegramInit } from '../hooks/useTelegramInit'
import { TgDebugOverlay } from '../components/TgDebugOverlay'
import './AppLayout.css'

export const AppLayout = () => {
  const location = useLocation()
  const { shouldBlock, loading } = useMaintenanceMode()
  const { closeProduct, isOpen } = useProductSheet()
  const { setFromTelegram } = useUser()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Initialize Telegram WebApp
  const { waPresent, tgUser, initData } = useTelegramInit()
  
  // Enable swipe-back gesture on scroll container
  useSwipeBack(scrollRef)

  // Set Telegram user on mount with retry logic (non-blocking, called once)
  useEffect(() => {
    const initUser = async () => {
      if (!waPresent) {
        // WebApp not available - browser mode, set user to null
        setFromTelegram(null)
        return
      }

      // Use ONLY initDataUnsafe.user (no wa.user - such field doesn't exist)
      const wa = (window as any).Telegram?.WebApp
      let currentUser = wa?.initDataUnsafe?.user || null

      if (currentUser) {
        // User available immediately
        setFromTelegram(currentUser)
        return
      }

      // Retry logic for Android Telegram (user may not be available immediately)
      const maxRetries = 10
      const retryInterval = 250

      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval))

        currentUser = wa?.initDataUnsafe?.user || null
        if (currentUser) {
          setFromTelegram(currentUser)
          if (import.meta.env.DEV) {
            console.log(`[TG] User loaded after ${i + 1} retries`)
          }
          return
        }
      }

      // User not available after retries - set to null (guest mode)
      setFromTelegram(null)
      if (import.meta.env.DEV) {
        console.log('[TG] User not available after retries, staying in guest mode (null)')
      }
    }

    initUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waPresent]) // Re-run if WebApp availability changes

  // Диагностика навигации (только в dev)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[NAV]', location.pathname)
    }
  }, [location.pathname])

  // UI Reset при изменении route - снимаем все залипшие состояния
  useEffect(() => {
    // 1) Unlock scroll - снимаем scroll-lock с .app-scroll
    if (scrollRef.current) {
      scrollRef.current.classList.remove('scroll-lock')
    }

    // 2) Закрываем ProductSheet если мы не на /app/product/:id
    // Это предотвращает залипание sheet при переходе на другие страницы (например, /app/banner/:id)
    if (!location.pathname.startsWith('/app/product/')) {
      if (isOpen) {
        if (import.meta.env.DEV) {
          console.log('[UI RESET] Closing ProductSheet on route change to:', location.pathname)
        }
        closeProduct()
      }
    }
  }, [location.pathname, isOpen, closeProduct])

  useEffect(() => {
    const isLab = location.pathname.startsWith('/app/lab')
    document.body.classList.toggle('lab-mode', isLab)
    return () => {
      document.body.classList.remove('lab-mode')
    }
  }, [location.pathname])

  // Don't block admin routes
  const isAdminRoute = location.pathname.startsWith('/app/admin')

  if (loading) {
    return (
      <div className={`app-layout app-root ${isAdminRoute ? 'admin-shell' : ''}`}>
        <BackgroundLayer />
        {!isAdminRoute && <Header />}
        <div className="app-scroll" ref={scrollRef}>
          <main className={`app-layout-main ${isAdminRoute ? 'admin-main-wrapper' : ''}`}>
            <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
              Загрузка...
            </div>
          </main>
          <Footer />
        </div>
        <ProductRouteHandler />
        <ProductSheetWrapper />
      </div>
    )
  }

  if (shouldBlock && !isAdminRoute) {
    return (
      <div className="app-layout app-root">
        <BackgroundLayer />
        <Header />
        <div className="app-scroll" ref={scrollRef}>
          <main className="app-layout-main">
            <MaintenancePage />
          </main>
          <Footer />
        </div>
        <ProductRouteHandler />
        <ProductSheetWrapper />
      </div>
    )
  }

  return (
    <div className={`app-layout app-root ${isAdminRoute ? 'admin-shell' : ''}`}>
      {/* Fixed background layer - НЕ в скролле */}
      <BackgroundLayer />
      
      {/* Sticky header - НЕ в скролле */}
      {!isAdminRoute && <Header />}
      
      {/* Единственный скролл-контейнер */}
      <div className="app-scroll" ref={scrollRef}>
        <main className={`app-layout-main ${isAdminRoute ? 'admin-main-wrapper' : ''}`}>
          <RouteTransitionWrapper>
            <Outlet />
          </RouteTransitionWrapper>
        </main>
        
        {/* Footer внутри скролла */}
        <Footer />
      </div>
      
      <ProductRouteHandler />
      <ProductSheetWrapper />
      <TgDebugOverlay />
    </div>
  )
}

