import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../modules/header/Header'
import { useMaintenanceMode } from '../hooks/useMaintenanceMode'
import { MaintenancePage } from '../pages/MaintenancePage'
import { ProductSheetWrapper } from '../components/ProductSheet/ProductSheetWrapper'
import { ProductRouteHandler } from '../components/ProductSheet/ProductRouteHandler'
import { useProductSheet } from '../context/ProductSheetContext'
import { Footer } from '../components/Footer/Footer'
import './AppLayout.css'

export const AppLayout = () => {
  const location = useLocation()
  const { shouldBlock, loading } = useMaintenanceMode()
  const { closeProduct, isOpen } = useProductSheet()

  // Диагностика навигации (только в dev)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[NAV]', location.pathname)
    }
  }, [location.pathname])

  // UI Reset при изменении route - снимаем все залипшие состояния
  useEffect(() => {
    // 1) Unlock scroll - снимаем scroll-lock с .app-scroll
    const scroller = document.querySelector('.app-scroll') as HTMLElement | null
    if (scroller) {
      scroller.classList.remove('scroll-lock')
    }

    // 2) Снимаем любые стили с body (если где-то устанавливались напрямую)
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''

    // 3) Закрываем ProductSheet если мы не на /app/product/:id
    // Это предотвращает залипание sheet при переходе на другие страницы (например, /app/banner/:id)
    if (!location.pathname.startsWith('/app/product/')) {
      if (isOpen) {
        if (import.meta.env.DEV) {
          console.log('[UI RESET] Closing ProductSheet on route change to:', location.pathname)
        }
        closeProduct()
      }
    }

    // 4) Диагностика в dev (уже есть проверка выше)
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
        {!isAdminRoute && <Header />}
        <div className="app-scroll">
          <main className={`app-layout-main ${isAdminRoute ? 'admin-main-wrapper' : ''}`}>
            <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
              Загрузка...
            </div>
          </main>
        </div>
        <ProductRouteHandler />
        <ProductSheetWrapper />
        <Footer />
      </div>
    )
  }

  if (shouldBlock && !isAdminRoute) {
    return (
      <div className="app-layout app-root">
        <Header />
        <div className="app-scroll">
          <main className="app-layout-main">
            <MaintenancePage />
          </main>
        </div>
        <ProductRouteHandler />
        <ProductSheetWrapper />
        <Footer />
      </div>
    )
  }

  return (
    <div className={`app-layout app-root ${isAdminRoute ? 'admin-shell' : ''}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdminRoute && <Header />}
      <div className="app-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main className={`app-layout-main ${isAdminRoute ? 'admin-main-wrapper' : ''}`} style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
      <ProductRouteHandler />
      <ProductSheetWrapper />
      <Footer />
    </div>
  )
}

