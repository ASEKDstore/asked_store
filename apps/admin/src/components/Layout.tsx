'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

interface MenuItem {
  name: string
  href: string
  icon: string
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Коммерция',
    items: [
      { name: 'Товары', href: '/products', icon: '🧥' },
      { name: 'Складской учёт', href: '/inventory', icon: '📦' },
      { name: 'Промо-коды', href: '/promo-codes', icon: '🎟️' },
      { name: 'Календарь акций', href: '/sales-calendar', icon: '📅' },
    ],
  },
  {
    title: 'Маркетинг',
    items: [
      { name: 'Баннеры', href: '/banners', icon: '🖼️' },
      { name: 'Рассылки', href: '/broadcasts', icon: '📣' },
      { name: 'Управление страницами', href: '/pages', icon: '🧩' },
    ],
  },
  {
    title: 'Бот и автоматизация',
    items: [
      { name: 'Настройка бота', href: '/bot-settings', icon: '🤖' },
      { name: 'Управление LAB', href: '/lab', icon: '🧪' },
    ],
  },
  {
    title: 'Аналитика',
    items: [
      { name: 'Статистика продаж', href: '/sales-stats', icon: '📈' },
      { name: 'Статистика (общая)', href: '/stats', icon: '🧭' },
    ],
  },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              Админ панель
            </Link>
          </div>
          
          {/* Burger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Меню"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar Menu (Right) */}
      <aside
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-6">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('admin_token')
                localStorage.removeItem('admin_telegram_id')
                window.location.href = '/login'
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>🚪</span>
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 top-16"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
