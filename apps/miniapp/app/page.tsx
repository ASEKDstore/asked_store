'use client'

import Link from 'next/link'

export default function Home() {
  // URL админ-панели (для локального теста)
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ASKED Mini App</h1>
        <p className="text-gray-600 mb-8">
          Мини-приложение для магазина одежды
        </p>

        {/* Кнопка для перехода в админ-панель (для теста) */}
        <div className="mt-8">
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <span>⚙️</span>
            <span>Админ-панель</span>
          </a>
        </div>
      </div>
    </main>
  )
}




