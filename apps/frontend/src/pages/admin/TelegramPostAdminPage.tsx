import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

interface TgButton {
  text: string
  url: string
}

interface Subscriber {
  tgId: number
  enabled: boolean
  createdAt: string
  lastSentAt?: string
}

type Tab = 'post' | 'subscribers'

export const TelegramPostAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [activeTab, setActiveTab] = useState<Tab>('post')
  
  // Post form state
  const [mode, setMode] = useState<'channel' | 'broadcast' | 'both'>('both')
  const [channelChatId, setChannelChatId] = useState('@asked_store')
  const [channelChatIdEditable, setChannelChatIdEditable] = useState(false)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [parseMode, setParseMode] = useState<'HTML' | 'MarkdownV2'>('HTML')
  const [disableWebPagePreview, setDisableWebPagePreview] = useState(false)
  const [buttons, setButtons] = useState<TgButton[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loadingSubscribers, setLoadingSubscribers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (activeTab === 'subscribers') {
      loadSubscribers()
    }
  }, [activeTab])

  const loadSubscribers = async () => {
    setLoadingSubscribers(true)
    try {
      const data = await api.getTelegramSubscribers()
      setSubscribers(data || [])
    } catch (err: any) {
      console.error('Failed to load subscribers:', err)
    } finally {
      setLoadingSubscribers(false)
    }
  }

  const handleToggleSubscriber = async (tgId: number) => {
    try {
      await api.toggleTelegramSubscriber(tgId)
      await loadSubscribers()
    } catch (err: any) {
      console.error('Failed to toggle subscriber:', err)
    }
  }

  const addButton = () => {
    setButtons([...buttons, { text: '', url: '' }])
  }

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index))
  }

  const updateButton = (index: number, field: 'text' | 'url', value: string) => {
    const updated = [...buttons]
    updated[index] = { ...updated[index], [field]: value }
    setButtons(updated)
  }

  const handleSend = async () => {
    if (!channelChatId.trim() || !text.trim()) {
      setError('Заполните channelChatId и текст')
      return
    }

    // Валидация кнопок
    const invalidButtons = buttons.some(btn => !btn.text.trim() || !btn.url.trim())
    if (invalidButtons) {
      setError('Все кнопки должны иметь текст и URL')
      return
    }

    setError(null)
    setSuccess(false)
    setSendResult(null)
    setSending(true)

    try {
      const result = await api.sendTelegramPost({
        mode,
        channelChatId: channelChatIdEditable ? (channelChatId.trim() || '@asked_store') : undefined,
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        parseMode,
        disableWebPagePreview,
      })

      setSuccess(true)
      setSendResult(result)
      setTimeout(() => setSuccess(false), 5000)
      
      // Очистка формы после успешной отправки
      setText('')
      setImageUrl('')
      setButtons([])
      
      // Обновляем подписчиков если была рассылка
      if (mode === 'broadcast' || mode === 'both') {
        await loadSubscribers()
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке')
      console.error('Send post error:', err)
    } finally {
      setSending(false)
    }
  }

  const textLength = text.length
  const maxLength = imageUrl ? 1024 : 4096
  const isTextTooLong = textLength > maxLength

  const filteredSubscribers = subscribers.filter(s => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return String(s.tgId).includes(query)
  })

  const activeSubscribers = subscribers.filter(s => s.enabled).length
  const totalSubscribers = subscribers.length

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Рассылка в Telegram</h2>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <button
          onClick={() => setActiveTab('post')}
          className="admin-btn"
          style={{
            background: activeTab === 'post' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'post' ? '2px solid #4caf50' : '2px solid transparent',
            borderRadius: '0',
            padding: '12px 24px',
            cursor: 'pointer',
          }}
        >
          📢 Пост/Рассылка
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className="admin-btn"
          style={{
            background: activeTab === 'subscribers' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'subscribers' ? '2px solid #4caf50' : '2px solid transparent',
            borderRadius: '0',
            padding: '12px 24px',
            cursor: 'pointer',
          }}
        >
          👥 Подписчики ({totalSubscribers}, активных: {activeSubscribers})
        </button>
      </div>

      {activeTab === 'post' && (
        <>
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#ff5252',
              fontSize: '14px',
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#4caf50',
              fontSize: '14px',
            }}>
              ✅ Сообщение отправлено успешно!
              {sendResult && (
                <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                  {sendResult.channel && (
                    <div>📢 Канал: сообщение #{sendResult.channel.messageId}</div>
                  )}
                  {sendResult.broadcast && (
                    <div>
                      📨 Рассылка: отправлено {sendResult.broadcast.sent}, 
                      ошибок {sendResult.broadcast.failed}, 
                      отключено {sendResult.broadcast.disabled}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="admin-card">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Режим отправки
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'channel' | 'broadcast' | 'both')}
              className="admin-input"
              disabled={sending}
            >
              <option value="channel">Только в канал</option>
              <option value="broadcast">Только рассылка подписчикам</option>
              <option value="both">Канал + рассылка</option>
            </select>
          </div>

          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Chat ID канала</label>
              <button
                type="button"
                onClick={() => setChannelChatIdEditable(!channelChatIdEditable)}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                disabled={sending}
              >
                {channelChatIdEditable ? '🔒 Заблокировать' : '✏️ Редактировать'}
              </button>
            </div>
            <input
              type="text"
              value={channelChatId}
              onChange={(e) => setChannelChatId(e.target.value)}
              placeholder="@asked_store или -1001234567890"
              className="admin-input"
              disabled={sending || !channelChatIdEditable}
              readOnly={!channelChatIdEditable}
              style={{
                opacity: channelChatIdEditable ? 1 : 0.7,
                cursor: channelChatIdEditable ? 'text' : 'not-allowed',
              }}
            />
            <p style={{ marginTop: '4px', fontSize: '12px', opacity: 0.7 }}>
              {channelChatIdEditable 
                ? 'Укажите ID канала (например, -1001234567890) или @username (например, @asked_store)'
                : 'По умолчанию: @asked_store. Нажмите "Редактировать" для изменения.'}
            </p>
          </div>

          <div className="admin-card">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Текст сообщения
              <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
                ({textLength} / {maxLength})
              </span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Текст поста..."
              className="admin-input"
              rows={8}
              disabled={sending}
              style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            {isTextTooLong && (
              <p style={{ marginTop: '4px', fontSize: '12px', color: '#ff5252' }}>
                ⚠️ Текст слишком длинный! Максимум {maxLength} символов.
              </p>
            )}
          </div>

          <div className="admin-card">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              URL изображения (опционально)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="admin-input"
              disabled={sending}
            />
            <p style={{ marginTop: '4px', fontSize: '12px', opacity: 0.7 }}>
              Если указано, будет отправлено фото с текстом как подписью
            </p>
          </div>

          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontWeight: '500' }}>Режим форматирования</label>
              <select
                value={parseMode}
                onChange={(e) => setParseMode(e.target.value as 'HTML' | 'MarkdownV2')}
                className="admin-input"
                style={{ width: 'auto', minWidth: '150px' }}
                disabled={sending}
              >
                <option value="HTML">HTML</option>
                <option value="MarkdownV2">MarkdownV2</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: '500' }}>Отключить превью ссылок</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={disableWebPagePreview}
                  onChange={(e) => setDisableWebPagePreview(e.target.checked)}
                  disabled={sending}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Inline кнопки</h3>
              <button
                onClick={addButton}
                className="admin-btn admin-btn-secondary"
                disabled={sending}
                type="button"
              >
                + Добавить кнопку
              </button>
            </div>

            {buttons.length === 0 ? (
              <p style={{ fontSize: '14px', opacity: 0.7, fontStyle: 'italic' }}>
                Кнопки не добавлены
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {buttons.map((button, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => updateButton(index, 'text', e.target.value)}
                        placeholder="Текст кнопки"
                        className="admin-input"
                        disabled={sending}
                      />
                      <input
                        type="url"
                        value={button.url}
                        onChange={(e) => updateButton(index, 'url', e.target.value)}
                        placeholder="https://example.com"
                        className="admin-input"
                        disabled={sending}
                      />
                    </div>
                    <button
                      onClick={() => removeButton(index)}
                      className="admin-btn admin-btn-secondary"
                      disabled={sending}
                      type="button"
                      style={{ padding: '8px 12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
              Кнопки будут расположены по 2 в ряд
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={handleSend}
              disabled={sending || !channelChatId.trim() || !text.trim() || isTextTooLong}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', fontSize: '16px', padding: '14px' }}
            >
              {sending ? '⏳ Отправка...' : '📤 Отправить'}
            </button>
          </div>
        </>
      )}

      {activeTab === 'subscribers' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Подписчики ({totalSubscribers}, активных: {activeSubscribers})
            </h3>
            <button
              onClick={loadSubscribers}
              className="admin-btn admin-btn-secondary"
              disabled={loadingSubscribers}
            >
              🔄 Обновить
            </button>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по Telegram ID..."
            className="admin-input"
            style={{ marginBottom: '16px' }}
          />

          {loadingSubscribers ? (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>Загрузка...</p>
          ) : filteredSubscribers.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.7, fontStyle: 'italic' }}>
              Подписчики не найдены
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSubscribers.map((sub) => (
                <div
                  key={sub.tgId}
                  style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>ID: {sub.tgId}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                      Создан: {new Date(sub.createdAt).toLocaleDateString('ru-RU')}
                      {sub.lastSentAt && ` • Последняя отправка: ${new Date(sub.lastSentAt).toLocaleDateString('ru-RU')}`}
                    </div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={sub.enabled}
                      onChange={() => handleToggleSubscriber(sub.tgId)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
