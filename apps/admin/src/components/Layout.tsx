'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Главная', href: '/', icon: '🏠' },
  { name: 'Товары', href: '/products', icon: '👕' },
  { name: 'Заказы', href: '/orders', icon: '📦' },
  { name: 'Баннеры', href: '/banners', icon: '🖼️' },
  { name: 'Страницы', href: '/pages', icon: '📄' },
  { name: 'Статистика', href: '/stats', icon: '📊' },
  { name: 'Остатки', href: '/inventory', icon: '📦' },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 bg-primary-600 text-white">
            <h1 className="text-xl font-bold">Админ панель</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center px-4 py-2 text-gray-600">
              <span className="text-sm">Выйти</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}

