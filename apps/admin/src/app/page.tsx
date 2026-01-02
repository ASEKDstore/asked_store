import Layout from '@/components/Layout'

export default function Home() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Главная панель</h1>
        
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-primary-600">0</div>
            <div className="text-gray-600 mt-2">Товаров</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-gray-600 mt-2">Заказов</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">0 ₽</div>
            <div className="text-gray-600 mt-2">Выручка</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <div className="text-gray-600 mt-2">Низкий остаток</div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Товары</h2>
            <p className="text-gray-600 mb-4">
              Управление каталогом товаров
            </p>
            <a href="/products" className="text-primary-600 hover:text-primary-700 font-medium">
              Перейти →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Баннеры</h2>
            <p className="text-gray-600 mb-4">
              Настройка баннеров на главной
            </p>
            <a href="/banners" className="text-primary-600 hover:text-primary-700 font-medium">
              Перейти →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Заказы</h2>
            <p className="text-gray-600 mb-4">
              Просмотр и управление заказами
            </p>
            <a href="/orders" className="text-primary-600 hover:text-primary-700 font-medium">
              Перейти →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Статистика</h2>
            <p className="text-gray-600 mb-4">
              Аналитика продаж и остатков
            </p>
            <a href="/stats" className="text-primary-600 hover:text-primary-700 font-medium">
              Перейти →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Страницы</h2>
            <p className="text-gray-600 mb-4">
              Управление страницами сайта
            </p>
            <a href="/pages" className="text-primary-600 hover:text-primary-700 font-medium">
              Перейти →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Остатки</h2>
            <p className="text-gray-600 mb-4">
              Учет товара и остатков
            </p>
            <a href="/inventory" className="text-primary-600 hover:text-primary-700 font-medium">
              Перейти →
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

