import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

type Promo = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  usedCount: number
  usageLimit: number | null
  expiresAt: string | null
}

export const PromosAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])

  useEffect(() => {
    loadPromos()
  }, [])

  const loadPromos = async () => {
    try {
      setLoading(true)
      const data = await api.getPromos() as Promo[]
      setPromos(data)
    } catch (error: any) {
      console.error('Failed to load promos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.updatePromo(id, { active: !currentActive })
      loadPromos()
    } catch (error: any) {
      alert('Ошибка при обновлении')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить промокод?')) return
    try {
      await api.deletePromo(id)
      loadPromos()
    } catch (error: any) {
      alert('Ошибка при удалении')
    }
  }

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      prefix: formData.get('prefix') as string || 'ASK',
      count: parseInt(formData.get('count') as string, 10),
      type: formData.get('type') as 'percent' | 'fixed',
      value: parseInt(formData.get('value') as string, 10),
      usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit') as string, 10) : null,
      expiresAt: formData.get('expiresAt') as string || null,
    }

    try {
      const generated = await api.generatePromos(data) as Promo[]
      setGeneratedCodes(generated.map((p: Promo) => p.code))
      setShowGenerator(false)
      loadPromos()
    } catch (error: any) {
      alert('Ошибка при генерации')
    }
  }

  const copyAllCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'))
    alert('Коды скопированы!')
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Промокоды</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={loadPromos} className="admin-refresh-btn">
            🔄 Обновить
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            className="admin-btn-primary"
          >
            + Генерировать
          </button>
        </div>
      </div>

      {generatedCodes.length > 0 && (
        <div className="admin-success-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Сгенерировано {generatedCodes.length} промокодов</strong>
            </div>
            <button onClick={copyAllCodes} className="admin-btn-small">
              Копировать всё
            </button>
          </div>
          <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {generatedCodes.map((code, idx) => (
              <div key={idx} style={{ fontFamily: 'monospace', fontSize: '13px', marginBottom: '4px' }}>
                {code}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : promos.length === 0 ? (
        <div className="admin-empty">Промокодов нет</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Тип</th>
                <th>Значение</th>
                <th>Активен</th>
                <th>Использовано</th>
                <th>Лимит</th>
                <th>Истекает</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => (
                <tr key={promo.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }} className="admin-ellipsis" title={promo.code}>{promo.code}</td>
                  <td>{promo.type === 'percent' ? '%' : '₽'}</td>
                  <td>{promo.value}</td>
                  <td>{promo.active ? '✓' : '✗'}</td>
                  <td>{promo.usedCount}</td>
                  <td>{promo.usageLimit || '∞'}</td>
                  <td>
                    {promo.expiresAt
                      ? new Date(promo.expiresAt).toLocaleDateString('ru-RU')
                      : '—'}
                  </td>
                  <td>
                    <div className="admin-actions-wrap">
                      <button
                        className="admin-btn-small"
                        onClick={() => handleToggleActive(promo.id, promo.active)}
                      >
                        {promo.active ? 'Выключить' : 'Включить'}
                      </button>
                      <button
                        className="admin-btn-small"
                        onClick={() => handleDelete(promo.id)}
                        style={{ background: 'rgba(255, 0, 0, 0.2)', borderColor: 'rgba(255, 0, 0, 0.3)' }}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showGenerator && (
        <div className="admin-modal-overlay" onClick={() => setShowGenerator(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Генератор промокодов</h3>
              <button onClick={() => setShowGenerator(false)}>✕</button>
            </div>
            <form className="admin-modal-content" onSubmit={handleGenerate}>
              <div className="admin-form-field">
                <label>Префикс</label>
                <input name="prefix" defaultValue="ASK" required />
              </div>
              <div className="admin-form-field">
                <label>Количество</label>
                <input name="count" type="number" min="1" defaultValue="20" required />
              </div>
              <div className="admin-form-field">
                <label>Тип</label>
                <select name="type" required>
                  <option value="percent">Процент</option>
                  <option value="fixed">Фиксированная сумма</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label>Значение</label>
                <input name="value" type="number" min="1" required />
              </div>
              <div className="admin-form-field">
                <label>Лимит использований (необязательно)</label>
                <input name="usageLimit" type="number" min="1" />
              </div>
              <div className="admin-form-field">
                <label>Истекает (необязательно)</label>
                <input name="expiresAt" type="date" />
              </div>
              <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Сгенерировать
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}



