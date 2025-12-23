import { useEffect } from 'react'
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
import { TgDebugOverlay } from '../components/TgDebugOverlay'
import { AppShell } from '../components/layout/AppShell'
import { clearLayers } from '../shared/layerManager'
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

  // UI Reset при изменении route
  useEffect(() => {
    // Закрываем ProductSheet если мы не на /app/product/:id
    // Это предотвращает залипание sheet при переходе на другие страницы (например, /app/banner/:id)
    if (!location.pathname.startsWith('/app/product/')) {
      if (isOpen) {
        if (import.meta.env.DEV) {
          console.log('[UI RESET] Closing ProductSheet on route change to:', location.pathname)
        }
        closeProduct()
      }
    }
    
    // Safety net: очищаем слои только при переходе на главную страницу
    // Это предотвращает залипание scroll-lock, но не сбрасывает открытые слои на других страницах
    if (location.pathname === '/app' || location.pathname === '/app/') {
      clearLayers()
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

  // Admin routes use their own layout
  if (isAdminRoute) {
    return (
      <div className="app-layout app-root admin-shell">
        <BackgroundLayer />
        <main className="app-layout-main admin-main-wrapper">
          <RouteTransitionWrapper>
            <Outlet />
          </RouteTransitionWrapper>
        </main>
        <ProductRouteHandler />
        <ProductSheetWrapper />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="app-layout app-root app-shell">
        <BackgroundLayer />
        <AppShell header={<Header />} footer={<Footer />}>
          <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
            Загрузка...
          </div>
        </AppShell>
        <ProductRouteHandler />
        <ProductSheetWrapper />
      </div>
    )
  }

  // Maintenance mode
  if (shouldBlock) {
    return (
      <div className="app-layout app-root app-shell">
        <BackgroundLayer />
        <AppShell header={<Header />} footer={<Footer />}>
          <MaintenancePage />
        </AppShell>
        <ProductRouteHandler />
        <ProductSheetWrapper />
      </div>
    )
  }

  // Normal app shell layout
  return (
    <div className="app-layout app-root app-shell">
      <BackgroundLayer />
      <AppShell header={<Header />} footer={<Footer />}>
        <RouteTransitionWrapper>
          <Outlet />
        </RouteTransitionWrapper>
      </AppShell>
      <ProductRouteHandler />
      <ProductSheetWrapper />
      <TgDebugOverlay />
    </div>
  )
}

