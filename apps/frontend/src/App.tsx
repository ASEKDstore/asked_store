import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { LoadingScreen } from './pages/LoadingScreen'
import { AppLayout } from './layouts/AppLayout'
import { MainPage } from './pages/main/MainPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { ProfileContent } from './pages/profile/ProfileContent'
import { OrdersAdminPage } from './pages/admin/OrdersAdminPage'
import { ProductsAdminPage } from './pages/admin/ProductsAdminPage'
import { PromosAdminPage } from './pages/admin/PromosAdminPage'
import { BannersAdminPage } from './pages/admin/BannersAdminPage'
import { LabAdminPage } from './pages/admin/LabAdminPage'
import { StatsAdminPage } from './pages/admin/StatsAdminPage'
import { AdminsAdminPage } from './pages/admin/AdminsAdminPage'
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage'
import { HomeAdminPage } from './pages/admin/HomeAdminPage'
import { TelegramPostAdminPage } from './pages/admin/TelegramPostAdminPage'
import { BotFlowsAdminPage } from './pages/admin/BotFlowsAdminPage'
import { AdminLayout } from './admin/AdminLayout'
import { AdminGuard } from './admin/AdminGuard'
import { BottomSheet } from './components/BottomSheet'
import { useModalRoute } from './hooks/useModalRoute'
import { BannerDetailsPage } from './pages/BannerDetailsPage'
import { CatalogPage } from './pages/CatalogPage'
import { LabPage } from './pages/LabPage'
import { LabOrderPage } from './pages/LabOrderPage'
import { LabWorkDetailsPage } from './pages/LabWorkDetailsPage'
import { LabProductDetailsPage } from './pages/LabProductDetailsPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { TryOnPage } from './pages/TryOnPage'
import { HelpPage } from './pages/HelpPage'
import { CollabPage } from './pages/CollabPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { ProductSheetProvider } from './context/ProductSheetContext'
import { ErrorBoundary } from './components/ErrorBoundary'

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

function App() {
  return (
    <ErrorBoundary>
      <ProductSheetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoadingScreen />} />
            <Route path="/app" element={<AppLayout />}>
            <Route index element={<MainPage />} />
            <Route path="profile" element={<ProfileRoute />} />
            <Route path="banner/:id" element={<BannerDetailsPage />} />
            <Route path="product/:id" element={<MainPage />} />
            <Route path="catalog" element={<CatalogPage />} />
          <Route path="lab" element={<LabPage />} />
          <Route path="lab/order" element={<LabOrderPage />} />
          <Route path="lab/work/:id" element={<LabWorkDetailsPage />} />
          <Route path="lab/product/:id" element={<LabProductDetailsPage />} />
          {/* Заглушки под остальные страницы */}
          <Route path="reviews" element={<ReviewsPage />} />
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
            <Route path="orders" element={<OrdersAdminPage />} />
            <Route path="products" element={<ProductsAdminPage />} />
            <Route path="promos" element={<PromosAdminPage />} />
            <Route path="banners" element={<BannersAdminPage />} />
            <Route path="lab" element={<LabAdminPage />} />
            <Route path="stats" element={<StatsAdminPage />} />
            <Route path="admins" element={<AdminsAdminPage />} />
            <Route path="home" element={<HomeAdminPage />} />
            <Route path="telegram" element={<TelegramPostAdminPage />} />
            <Route path="bot/flows" element={<BotFlowsAdminPage />} />
            <Route path="settings" element={<SettingsAdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </ProductSheetProvider>
    </ErrorBoundary>
  )
}

export default App
