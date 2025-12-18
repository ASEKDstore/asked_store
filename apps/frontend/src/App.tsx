import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { LoadingScreen } from './pages/LoadingScreen'
import { AppLayout } from './layouts/AppLayout'
import { TgDebugPanel } from './components/TgDebugPanel'
import { MainPage } from './pages/main/MainPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { ProfileContent } from './pages/profile/ProfileContent'
import { AdminLayout } from './admin/AdminLayout'
import { AdminGuard } from './admin/AdminGuard'
import { BottomSheet } from './components/BottomSheet'
import { useModalRoute } from './hooks/useModalRoute'
import { BannerDetailsPage } from './pages/BannerDetailsPage'
import { CatalogPage } from './pages/CatalogPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { TryOnPage } from './pages/TryOnPage'
import { HelpPage } from './pages/HelpPage'
import { CollabPage } from './pages/CollabPage'
import { ProductSheetProvider } from './context/ProductSheetContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load heavy pages (admin, lab, reviews)
const OrdersAdminPage = lazy(() => import('./pages/admin/OrdersAdminPage').then(m => ({ default: m.OrdersAdminPage })))
const ProductsAdminPage = lazy(() => import('./pages/admin/ProductsAdminPage').then(m => ({ default: m.ProductsAdminPage })))
const PromosAdminPage = lazy(() => import('./pages/admin/PromosAdminPage').then(m => ({ default: m.PromosAdminPage })))
const BannersAdminPage = lazy(() => import('./pages/admin/BannersAdminPage').then(m => ({ default: m.BannersAdminPage })))
const LabAdminPage = lazy(() => import('./pages/admin/LabAdminPage').then(m => ({ default: m.LabAdminPage })))
const StatsAdminPage = lazy(() => import('./pages/admin/StatsAdminPage').then(m => ({ default: m.StatsAdminPage })))
const AdminsAdminPage = lazy(() => import('./pages/admin/AdminsAdminPage').then(m => ({ default: m.AdminsAdminPage })))
const SettingsAdminPage = lazy(() => import('./pages/admin/SettingsAdminPage').then(m => ({ default: m.SettingsAdminPage })))
const HomeAdminPage = lazy(() => import('./pages/admin/HomeAdminPage').then(m => ({ default: m.HomeAdminPage })))
const TelegramPostAdminPage = lazy(() => import('./pages/admin/TelegramPostAdminPage').then(m => ({ default: m.TelegramPostAdminPage })))
const BotFlowsAdminPage = lazy(() => import('./pages/admin/BotFlowsAdminPage').then(m => ({ default: m.BotFlowsAdminPage })))
const LabPage = lazy(() => import('./pages/LabPage').then(m => ({ default: m.LabPage })))
const LabOrderPage = lazy(() => import('./pages/LabOrderPage').then(m => ({ default: m.LabOrderPage })))
const LabWorkDetailsPage = lazy(() => import('./pages/LabWorkDetailsPage').then(m => ({ default: m.LabWorkDetailsPage })))
const LabProductDetailsPage = lazy(() => import('./pages/LabProductDetailsPage').then(m => ({ default: m.LabProductDetailsPage })))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })))

// Loading fallback component
const PageLoader = () => (
  <div style={{ padding: '48px', textAlign: 'center', color: '#f5f5f5' }}>
    Загрузка...
  </div>
)

function ProfileRoute() {
  const location = useLocation()
  const { isModal, closeModal } = useModalRoute()
  const isProfileRoute = location.pathname === '/app/profile'

  if (isModal && isProfileRoute) {
    return (
      <BottomSheet open={true} onClose={closeModal} title="Профиль">
        <ProfileContent />
      </BottomSheet>
    )
  }

  return <ProfilePage />
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LoadingScreen />} />
      <Route path="/app" element={<AppLayout />}>
      <Route index element={<MainPage />} />
      <Route path="profile" element={<ProfileRoute />} />
      <Route path="banner/:id" element={<BannerDetailsPage />} />
      <Route path="product/:id" element={<MainPage />} />
      <Route path="catalog" element={<CatalogPage />} />
      <Route path="lab" element={
        <Suspense fallback={<PageLoader />}>
          <LabPage />
        </Suspense>
      } />
      <Route path="lab/order" element={
        <Suspense fallback={<PageLoader />}>
          <LabOrderPage />
        </Suspense>
      } />
      <Route path="lab/work/:id" element={
        <Suspense fallback={<PageLoader />}>
          <LabWorkDetailsPage />
        </Suspense>
      } />
      <Route path="lab/product/:id" element={
        <Suspense fallback={<PageLoader />}>
          <LabProductDetailsPage />
        </Suspense>
      } />
      {/* Заглушки под остальные страницы */}
      <Route path="reviews" element={
        <Suspense fallback={<PageLoader />}>
          <ReviewsPage />
        </Suspense>
      } />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="try-on" element={<TryOnPage />} />
      <Route path="about" element={<div style={{ padding: '32px 16px', textAlign: 'center' }}>О нас (в разработке)</div>} />
      <Route path="help" element={<HelpPage />} />
      <Route path="collab" element={<CollabPage />} />
      <Route path="docs" element={<div style={{ padding: '32px 16px', textAlign: 'center' }}>Документы (в разработке)</div>} />
      <Route path="partners" element={<div style={{ padding: '32px 16px', textAlign: 'center' }}>Сотрудничество (в разработке)</div>} />
      <Route path="admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index element={<Navigate to="/app/admin/orders" replace />} />
        <Route path="orders" element={
          <Suspense fallback={<PageLoader />}>
            <OrdersAdminPage />
          </Suspense>
        } />
        <Route path="products" element={
          <Suspense fallback={<PageLoader />}>
            <ProductsAdminPage />
          </Suspense>
        } />
        <Route path="promos" element={
          <Suspense fallback={<PageLoader />}>
            <PromosAdminPage />
          </Suspense>
        } />
        <Route path="banners" element={
          <Suspense fallback={<PageLoader />}>
            <BannersAdminPage />
          </Suspense>
        } />
        <Route path="lab" element={
          <Suspense fallback={<PageLoader />}>
            <LabAdminPage />
          </Suspense>
        } />
        <Route path="stats" element={
          <Suspense fallback={<PageLoader />}>
            <StatsAdminPage />
          </Suspense>
        } />
        <Route path="admins" element={
          <Suspense fallback={<PageLoader />}>
            <AdminsAdminPage />
          </Suspense>
        } />
        <Route path="home" element={
          <Suspense fallback={<PageLoader />}>
            <HomeAdminPage />
          </Suspense>
        } />
        <Route path="telegram" element={
          <Suspense fallback={<PageLoader />}>
            <TelegramPostAdminPage />
          </Suspense>
        } />
        <Route path="bot/flows" element={
          <Suspense fallback={<PageLoader />}>
            <BotFlowsAdminPage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}>
            <SettingsAdminPage />
          </Suspense>
        } />
      </Route>
    </Route>
  </Routes>
  )
}

function App() {
  // Top-level Telegram auth - runs on app start, independent of routing
  useEffect(() => {
    const performTelegramAuth = async () => {
      try {
        const tg = window.Telegram?.WebApp
        
        console.log('[AUTH] hasWebApp', !!tg)
        
        if (!tg) {
          console.warn('[AUTH] Telegram WebApp not found')
          return
        }

        // Initialize WebApp
        tg.ready?.()
        tg.expand?.()

        // Get initData
        const initData = tg?.initData || ''
        console.log('[AUTH] initDataLen', initData.length)
        
        if (initData.length === 0) {
          console.warn('[AUTH] initData is empty')
          return
        }

        // Get backend URL - try VITE_BACKEND_URL first, then fallback to VITE_API_URL/VITE_API_BASE
        const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 
                              (import.meta as any).env?.VITE_API_URL || 
                              (import.meta as any).env?.VITE_API_BASE
        
        // Fallback to known backend URL if env variable is missing
        const backendUrl = envBackendUrl || 'https://asked-store-backend.onrender.com'
        
        if (!envBackendUrl) {
          console.warn('[AUTH] VITE_BACKEND_URL/VITE_API_URL not set, using fallback:', backendUrl)
        } else {
          console.log('[AUTH] Using backend URL from env:', backendUrl)
        }
        
        // Construct full auth URL
        const authUrl = backendUrl.endsWith('/') 
          ? `${backendUrl}api/auth/telegram`
          : `${backendUrl}/api/auth/telegram`
        console.log('[AUTH] backendUrl', authUrl)

        // Make auth request
        console.log('[AUTH] Making POST request to /api/auth/telegram')
        const response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })

        console.log('[AUTH] status', response.status)
        
        const responseText = await response.text()
        console.log('[AUTH] body', responseText)

        if (!response.ok) {
          console.error('[AUTH] Auth failed:', response.status, responseText)
          return
        }

        // Parse response and store token
        try {
          const data = JSON.parse(responseText)
          if (data.token) {
            localStorage.setItem('asked_telegram_token', data.token)
            console.log('[AUTH] Token stored successfully')
          }
          if (data.user) {
            console.log('[AUTH] User authenticated:', data.user)
          }
        } catch (parseError) {
          console.error('[AUTH] Failed to parse response:', parseError)
        }
      } catch (error) {
        console.error('[AUTH] Error during auth:', error)
      }
    }

    // Run auth immediately on mount
    performTelegramAuth()
  }, [])

  return (
    <ErrorBoundary>
      <ProductSheetProvider>
        <BrowserRouter>
          <AppContent />
          <TgDebugPanel />
        </BrowserRouter>
    </ProductSheetProvider>
    </ErrorBoundary>
  )
}

export default App
