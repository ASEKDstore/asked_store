import Layout from '@/components/Layout'

export default function Home() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Главная панель</h1>
        <p className="text-gray-600 mb-8">Обзор вашего магазина</p>
        
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Товаров</span>
              <span className="text-2xl">🧥</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Заказов</span>
              <span className="text-2xl">📦</span>
            </div>
            <div className="text-3xl font-bold text-green-600">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Выручка</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">0 ₽</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Низкий остаток</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">0</div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/products"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🧥</span>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                Товары
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Управление каталогом товаров
            </p>
          </a>

          <a
            href="/inventory"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📦</span>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                Складской учёт
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Учет товара и остатков
            </p>
          </a>

          <a
            href="/sales-stats"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📈</span>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                Статистика продаж
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Аналитика продаж и остатков
            </p>
          </a>
        </div>
      </div>
    </Layout>
  )
}
