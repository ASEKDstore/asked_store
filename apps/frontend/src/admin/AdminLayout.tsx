import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSafeNavigate } from '../hooks/useSafeNavigate'
import './AdminLayout.css'

const tabs = [
  { path: '/app/admin/orders', label: 'Заказы', icon: '📦' },
  { path: '/app/admin/products', label: 'Товары', icon: '🛍️' },
  { path: '/app/admin/categories', label: 'Категории', icon: '🏷️' },
  { path: '/app/admin/promos', label: 'Промокоды', icon: '🎟️' },
  { path: '/app/admin/banners', label: 'Баннеры', icon: '🖼️' },
  { path: '/app/admin/lab', label: 'LAB', icon: '🧪' },
  { path: '/app/admin/stats', label: 'Статистика', icon: '📊' },
  { path: '/app/admin/admins', label: 'Админы', icon: '👥' },
  { path: '/app/admin/home', label: 'Главная', icon: '🏠' },
  { path: '/app/admin/telegram', label: 'Рассылка', icon: '📢' },
  { path: '/app/admin/bot/flows', label: 'Бот → Сценарии', icon: '🤖' },
  { path: '/app/admin/settings', label: 'Настройки', icon: '⚙️' },
]

export const AdminLayout: React.FC = () => {
  const safeNavigate = useSafeNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentPath = location.pathname

  const handleExit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Всегда переходим на главную страницу
    safeNavigate('/app')
    // Закрываем меню, если открыто
    setSidebarOpen(false)
  }

  const toggleMenu = () => setSidebarOpen((v) => !v)

  // Блокируем скролл body только в админке
  React.useEffect(() => {
    document.body.classList.add('admin-lock-scroll')
    return () => {
      document.body.classList.remove('admin-lock-scroll')
    }
  }, [])

  // Блокируем скролл body при открытом меню (дополнительно)
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="admin-layout admin-root">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-header-title">ADMIN PANEL</h1>
          <div className="admin-header-actions">
            <button
              className="admin-exit-btn"
              type="button"
              onClick={handleExit}
              aria-label="Выйти из админки"
            >
              ← Обычный режим
            </button>
            <button
              className={`admin-burger ${sidebarOpen ? 'admin-burger--open' : ''}`}
              onClick={toggleMenu}
              aria-label="Меню"
              aria-expanded={sidebarOpen}
            >
              <div className="admin-burger-lines">
                <span />
                <span />
                <span />
              </div>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`admin-menu-overlay ${sidebarOpen ? 'is-open' : ''}`}
        onClick={toggleMenu}
      />

      <nav className={`admin-menu ${sidebarOpen ? 'is-open' : ''}`}>
        <ul>
          {tabs.map(tab => (
            <li key={tab.path}>
              <button
                className={`admin-menu-item ${currentPath === tab.path ? 'is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  safeNavigate(tab.path)
                  setSidebarOpen(false)
                }}
              >
                <span className="admin-menu-icon">{tab.icon}</span>
                <span className="admin-menu-label">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {tabs.map(tab => (
              <button
                key={tab.path}
                className={`admin-nav-item ${currentPath === tab.path ? 'is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  safeNavigate(tab.path)
                }}
              >
                <span className="admin-nav-icon">{tab.icon}</span>
                <span className="admin-nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

