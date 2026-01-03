import Layout from '@/components/Layout'

export default function BannersPage() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🖼️ Баннеры</h1>
        <p className="text-gray-600 mb-8">Управление баннерами на главной странице</p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-gray-600">Страница в разработке</p>
        </div>
      </div>
    </Layout>
  )
}

