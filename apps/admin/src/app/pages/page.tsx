import Layout from '@/components/Layout'

export default function PagesPage() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧩 Управление страницами</h1>
        <p className="text-gray-600 mb-8">Редактирование страниц сайта</p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-gray-600">Страница в разработке</p>
        </div>
      </div>
    </Layout>
  )
}

