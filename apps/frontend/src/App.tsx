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
import { SessionExpiredHandler } from './components/SessionExpiredHandler'

// Lazy load heavy pages (admin, lab, reviews)
const OrdersAdminPage = lazy(() => import('./pages/admin/OrdersAdminPage').then(m => ({ default: m.OrdersAdminPage })))
const ProductsAdminPage = lazy(() => import('./pages/admin/ProductsAdminPage').then(m => ({ default: m.ProductsAdminPage })))
const CategoriesAdminPage = lazy(() => import('./pages/admin/CategoriesAdminPage').then(m => ({ default: m.CategoriesAdminPage })))
const PromosAdminPage = lazy(() => import('./pages/admin/PromosAdminPage').then(m => ({ default: m.PromosAdminPage })))
const BannersAdminPage = lazy(() => import('./pages/admin/BannersAdminPage').then(m => ({ default: m.BannersAdminPage })))
const LabAdminPage = lazy(() => import('./pages/admin/LabAdminPage').then(m => ({ default: m.LabAdminPage })))
const StatsAdminPage = lazy(() => import('./pages/admin/StatsAdminPage').then(m => ({ default: m.StatsAdminPage })))
const AdminsAdminPage = lazy(() => import('./pages/admin/AdminsAdminPage').then(m => ({ default: m.AdminsAdminPage })))
const SettingsAdminPage = lazy(() => import('./pages/admin/SettingsAdminPage').then(m => ({ default: m.SettingsAdminPage })))
const HomeAdminPage = lazy(() => import('./pages/admin/HomeAdminPage').then(m => ({ default: m.HomeAdminPage })))
const TelegramPostAdminPage = lazy(() => import('./pages/admin/TelegramPostAdminPage').then(m => ({ default: m.TelegramPostAdminPage })))
const BotFlowsAdminPage = lazy(() => import('./pages/admin/BotFlowsAdminPageV2').then(m => ({ default: m.BotFlowsAdminPageV2 })))
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
        <Route path="categories" element={
          <Suspense fallback={<PageLoader />}>
            <CategoriesAdminPage />
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
  // Auth logic is now in AuthProvider (context)
  // This component just renders the app structure
  
  return (
    <ErrorBoundary>
      <ProductSheetProvider>
        <BrowserRouter>
          <SessionExpiredHandler />
          <AppContent />
          <TgDebugPanel />
        </BrowserRouter>
    </ProductSheetProvider>
    </ErrorBoundary>
  )
}

export default App
