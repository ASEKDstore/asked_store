import { useState, useEffect } from 'react'
import { useAdminApi } from '../../api/adminApi'
import './AdminPages.css'

interface BotButton {
  id: string
  text: string
  kind: 'next' | 'url' | 'action'
  nextStepId?: string
  url?: string
  action?: 'open_catalog' | 'open_top_games' | 'open_lab' | 'noop'
}

interface BotStepContent {
  type: 'message' | 'photo'
  text?: string
  caption?: string
  imageUrl?: string
  parseMode?: 'HTML' | 'MarkdownV2'
  entitiesJson?: any
}

interface BotStep {
  id: string
  name: string
  content: BotStepContent
  buttons?: BotButton[]
}

interface BotFlow {
  id: string
  name: string
  trigger: 'start' | 'menu' | 'help' | 'custom'
  startStepId: string
  enabled: boolean
  steps: BotStep[]
  updatedAt: string
}

type ViewMode = 'list' | 'edit' | 'create'

export const BotFlowsAdminPage: React.FC = () => {
  const api = useAdminApi()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [flows, setFlows] = useState<Omit<BotFlow, 'steps'>[]>([])
  const [currentFlow, setCurrentFlow] = useState<BotFlow | null>(null)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customEmojiId, setCustomEmojiId] = useState('')

  useEffect(() => {
    if (viewMode === 'list') {
      loadFlows()
    }
  }, [viewMode])

  const loadFlows = async () => {
    setLoading(true)
    try {
      const data = await api.getBotFlows() as Omit<BotFlow, 'steps'>[]
      setFlows(data || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }

  const loadFlow = async (id: string) => {
    setLoading(true)
    try {
      const data = await api.getBotFlow(id) as BotFlow | null
      if (!data) {
        setCurrentFlow(null)
        setSelectedStepId(null)
        setError('Flow not found')
        return
      }
      setCurrentFlow(data)
      setSelectedStepId(data.startStepId)
      setViewMode('edit')
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    const newFlow: BotFlow = {
      id: '',
      name: 'Новый сценарий',
      trigger: 'start',
      startStepId: '',
      enabled: true,
      steps: [],
      updatedAt: new Date().toISOString(),
    }
    setCurrentFlow(newFlow)
    setSelectedStepId(null)
    setViewMode('create')
  }

  const handleSave = async () => {
    if (!currentFlow) return

    setError(null)
    setLoading(true)

    try {
      // Валидация
      if (!currentFlow.name.trim()) {
        setError('Название обязательно')
        return
      }
      if (currentFlow.steps.length === 0) {
        setError('Добавьте хотя бы один шаг')
        return
      }
      if (!currentFlow.startStepId) {
        setError('Укажите начальный шаг')
        return
      }

      if (viewMode === 'create') {
        await api.createBotFlow(currentFlow)
      } else {
        await api.updateBotFlow(currentFlow.id, currentFlow)
      }

      setViewMode('list')
      await loadFlows()
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить сценарий?')) return

    setLoading(true)
    try {
      await api.deleteBotFlow(id)
      await loadFlows()
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async (flowId: string, stepId?: string) => {
    setLoading(true)
    try {
      await api.testBotFlow(flowId, stepId)
      alert('Тестовое сообщение отправлено вам в Telegram')
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке теста')
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    if (!currentFlow) return

    const newStep: BotStep = {
      id: `step_${Date.now()}`,
      name: `Шаг ${currentFlow.steps.length + 1}`,
      content: {
        type: 'message',
        text: '',
      },
    }

    setCurrentFlow({
      ...currentFlow,
      steps: [...currentFlow.steps, newStep],
      startStepId: currentFlow.startStepId || newStep.id,
    })
    setSelectedStepId(newStep.id)
  }

  const updateStep = (stepId: string, updates: Partial<BotStep>) => {
    if (!currentFlow) return

    const updatedSteps = currentFlow.steps.map(s =>
      s.id === stepId ? { ...s, ...updates } : s
    )

    setCurrentFlow({
      ...currentFlow,
      steps: updatedSteps,
    })
  }

  const deleteStep = (stepId: string) => {
    if (!currentFlow) return
    if (currentFlow.steps.length <= 1) {
      alert('Нельзя удалить последний шаг')
      return
    }

    const updatedSteps = currentFlow.steps.filter(s => s.id !== stepId)
    setCurrentFlow({
      ...currentFlow,
      steps: updatedSteps,
      startStepId: currentFlow.startStepId === stepId 
        ? (updatedSteps[0]?.id || '')
        : currentFlow.startStepId,
    })

    if (selectedStepId === stepId) {
      setSelectedStepId(updatedSteps[0]?.id || null)
    }
  }

  const addButton = (stepId: string) => {
    if (!currentFlow) return

    const step = currentFlow.steps.find(s => s.id === stepId)
    if (!step) return

    const newButton: BotButton = {
      id: `btn_${Date.now()}`,
      text: 'Новая кнопка',
      kind: 'next',
    }

    updateStep(stepId, {
      buttons: [...(step.buttons || []), newButton],
    })
  }

  const updateButton = (stepId: string, buttonId: string, updates: Partial<BotButton>) => {
    if (!currentFlow) return

    const step = currentFlow.steps.find(s => s.id === stepId)
    if (!step) return

    const updatedButtons = (step.buttons || []).map(b =>
      b.id === buttonId ? { ...b, ...updates } : b
    )

    updateStep(stepId, { buttons: updatedButtons })
  }

  const deleteButton = (stepId: string, buttonId: string) => {
    if (!currentFlow) return

    const step = currentFlow.steps.find(s => s.id === stepId)
    if (!step) return

    const updatedButtons = (step.buttons || []).filter(b => b.id !== buttonId)
    updateStep(stepId, { buttons: updatedButtons })
  }

  const insertCustomEmoji = (stepId: string, field: 'text' | 'caption') => {
    if (!customEmojiId.trim()) {
      alert('Введите custom_emoji_id')
      return
    }

    if (!currentFlow) return
    const step = currentFlow.steps.find(s => s.id === stepId)
    if (!step) return

    // Определяем текущий текст (для message это text, для photo это caption)
    const currentText = step.content.type === 'message' 
      ? (step.content.text || '')
      : (step.content.caption || '')
    
    const placeholder = `:emoji_${customEmojiId}:`
    const offset = currentText.length
    const length = placeholder.length
    const newText = currentText + placeholder

    // Обновляем entitiesJson (корректно считаем offset/length относительно caption для photo)
    const entities = Array.isArray(step.content.entitiesJson) 
      ? [...step.content.entitiesJson] 
      : []
    
    entities.push({
      type: 'custom_emoji',
      offset: offset,
      length: length,
      custom_emoji_id: customEmojiId,
    })

    // Обновляем контент в зависимости от типа
    if (step.content.type === 'message') {
      updateStep(stepId, {
        content: {
          ...step.content,
          text: newText,
          entitiesJson: entities,
        },
      })
    } else {
      updateStep(stepId, {
        content: {
          ...step.content,
          caption: newText,
          entitiesJson: entities,
        },
      })
    }
  }

  const selectedStep = currentFlow?.steps.find(s => s.id === selectedStepId)

  if (viewMode === 'list') {
    return (
      <div className="admin-page">
        <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Сценарии бота</h2>
          <button onClick={handleCreateNew} className="admin-btn admin-btn-primary">
            + Создать сценарий
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px', marginBottom: '20px', color: '#ff5252' }}>
            ❌ {error}
          </div>
        )}

        {loading ? (
          <p>Загрузка...</p>
        ) : flows.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Сценарии не созданы</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {flows.map(flow => (
              <div
                key={flow.id}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{flow.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Триггер: {flow.trigger} • Обновлён: {new Date(flow.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={flow.enabled}
                      onChange={async () => {
                        // Toggle enabled
                        const fullFlow = await api.getBotFlow(flow.id) as BotFlow | null
                        if (fullFlow) {
                          await api.updateBotFlow(flow.id, { ...fullFlow, enabled: !fullFlow.enabled })
                        }
                        await loadFlows()
                      }}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <button onClick={() => handleTest(flow.id)} className="admin-btn admin-btn-secondary">
                    🧪 Тест
                  </button>
                  <button onClick={() => loadFlow(flow.id)} className="admin-btn admin-btn-secondary">
                    ✏️ Редактировать
                  </button>
                  <button onClick={() => handleDelete(flow.id)} className="admin-btn admin-btn-secondary">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{viewMode === 'create' ? 'Создание сценария' : 'Редактирование сценария'}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewMode('list')} className="admin-btn admin-btn-secondary">
            ← Назад
          </button>
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={loading}>
            💾 Сохранить
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px', marginBottom: '20px', color: '#ff5252' }}>
          ❌ {error}
        </div>
      )}

      {currentFlow && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Левая панель: список шагов */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Шаги</h3>
              <button onClick={addStep} className="admin-btn admin-btn-secondary" style={{ padding: '4px 8px' }}>
                + Добавить
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentFlow.steps.map(step => (
                <div
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  style={{
                    padding: '12px',
                    background: selectedStepId === step.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedStepId === step.id ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid transparent',
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{step.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {step.content.type === 'message' ? '📝 Сообщение' : '🖼️ Фото'}
                    {currentFlow.startStepId === step.id && ' • Старт'}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (currentFlow.steps.length > 1) {
                          setCurrentFlow({ ...currentFlow, startStepId: step.id })
                        }
                      }}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      disabled={currentFlow.startStepId === step.id}
                    >
                      Старт
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteStep(step.id)
                      }}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      disabled={currentFlow.steps.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Правая панель: редактор шага */}
          <div>
            {selectedStep ? (
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>Редактирование шага</h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Название шага</label>
                  <input
                    type="text"
                    value={selectedStep.name}
                    onChange={(e) => updateStep(selectedStep.id, { name: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Тип контента</label>
                  <select
                    value={selectedStep.content.type}
                    onChange={(e) => {
                      const newContent: BotStepContent = e.target.value === 'message'
                        ? { type: 'message', text: '' }
                        : { type: 'photo', imageUrl: '', caption: '' }
                      updateStep(selectedStep.id, { content: newContent })
                    }}
                    className="admin-input"
                  >
                    <option value="message">📝 Сообщение</option>
                    <option value="photo">🖼️ Фото</option>
                  </select>
                </div>

                {selectedStep.content.type === 'message' ? (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Текст</label>
                    <textarea
                      value={selectedStep.content.text || ''}
                      onChange={(e) => updateStep(selectedStep.id, {
                        content: { ...selectedStep.content, text: e.target.value },
                      })}
                      className="admin-input"
                      rows={6}
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>URL изображения</label>
                      <input
                        type="url"
                        value={selectedStep.content.imageUrl || ''}
                        onChange={(e) => updateStep(selectedStep.id, {
                          content: { ...selectedStep.content, imageUrl: e.target.value },
                        })}
                        className="admin-input"
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Подпись (caption)</label>
                      <textarea
                        value={selectedStep.content.caption || ''}
                        onChange={(e) => updateStep(selectedStep.id, {
                          content: { ...selectedStep.content, caption: e.target.value },
                        })}
                        className="admin-input"
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: '500' }}>Режим форматирования</label>
                    {selectedStep.content.entitiesJson && Array.isArray(selectedStep.content.entitiesJson) && selectedStep.content.entitiesJson.length > 0 && (
                      <span style={{ fontSize: '12px', opacity: 0.7, color: '#ff9800' }}>
                        ⚠️ При наличии custom emoji parse_mode не используется
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedStep.content.parseMode || 'HTML'}
                    onChange={(e) => updateStep(selectedStep.id, {
                      content: { ...selectedStep.content, parseMode: e.target.value as 'HTML' | 'MarkdownV2' },
                    })}
                    className="admin-input"
                    disabled={selectedStep.content.entitiesJson && Array.isArray(selectedStep.content.entitiesJson) && selectedStep.content.entitiesJson.length > 0}
                  >
                    <option value="HTML">HTML</option>
                    <option value="MarkdownV2">MarkdownV2</option>
                  </select>
                  {selectedStep.content.entitiesJson && Array.isArray(selectedStep.content.entitiesJson) && selectedStep.content.entitiesJson.length > 0 && (
                    <p style={{ marginTop: '4px', fontSize: '12px', opacity: 0.7 }}>
                      Parse mode отключён, так как используются custom emoji ({selectedStep.content.type === 'photo' ? 'caption_entities' : 'entities'})
                    </p>
                  )}
                </div>

                {/* Блок Custom Emoji */}
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Эмодзи (custom_emoji)
                    {selectedStep.content.type === 'photo' && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
                        (вставляется в caption)
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={customEmojiId}
                      onChange={(e) => setCustomEmojiId(e.target.value)}
                      placeholder="custom_emoji_id"
                      className="admin-input"
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => insertCustomEmoji(selectedStep.id, selectedStep.content.type === 'message' ? 'text' : 'caption')}
                      className="admin-btn admin-btn-secondary"
                    >
                      Вставить
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', opacity: 0.7 }}>
                    {selectedStep.content.type === 'photo' 
                      ? 'Введите custom_emoji_id и нажмите "Вставить" для добавления в подпись (caption)'
                      : 'Введите custom_emoji_id и нажмите "Вставить" для добавления в текст'}
                  </p>
                  {selectedStep.content.entitiesJson && Array.isArray(selectedStep.content.entitiesJson) && selectedStep.content.entitiesJson.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', fontSize: '12px' }}>
                      ✅ Добавлено эмодзи: {selectedStep.content.entitiesJson.length}
                    </div>
                  )}
                </div>

                {/* Кнопки */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>Кнопки</h4>
                    <button onClick={() => addButton(selectedStep.id)} className="admin-btn admin-btn-secondary" style={{ padding: '4px 8px' }}>
                      + Добавить
                    </button>
                  </div>

                  {selectedStep.buttons && selectedStep.buttons.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedStep.buttons.map(btn => (
                        <div key={btn.id} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              value={btn.text}
                              onChange={(e) => updateButton(selectedStep.id, btn.id, { text: e.target.value })}
                              placeholder="Текст кнопки"
                              className="admin-input"
                              style={{ flex: 1 }}
                            />
                            <button
                              onClick={() => deleteButton(selectedStep.id, btn.id)}
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '4px 8px' }}
                            >
                              🗑️
                            </button>
                          </div>
                          <select
                            value={btn.kind}
                            onChange={(e) => {
                              const updates: Partial<BotButton> = { kind: e.target.value as any }
                              if (e.target.value === 'next') {
                                updates.nextStepId = currentFlow?.steps[0]?.id
                              } else if (e.target.value === 'url') {
                                updates.url = ''
                              }
                              updateButton(selectedStep.id, btn.id, updates)
                            }}
                            className="admin-input"
                            style={{ marginBottom: '8px' }}
                          >
                            <option value="next">→ Следующий шаг</option>
                            <option value="url">🔗 URL</option>
                            <option value="action">⚙️ Действие</option>
                          </select>
                          {btn.kind === 'next' && (
                            <select
                              value={btn.nextStepId || ''}
                              onChange={(e) => updateButton(selectedStep.id, btn.id, { nextStepId: e.target.value })}
                              className="admin-input"
                            >
                              <option value="">Выберите шаг</option>
                              {currentFlow?.steps.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          )}
                          {btn.kind === 'url' && (
                            <input
                              type="url"
                              value={btn.url || ''}
                              onChange={(e) => updateButton(selectedStep.id, btn.id, { url: e.target.value })}
                              placeholder="https://..."
                              className="admin-input"
                            />
                          )}
                          {btn.kind === 'action' && (
                            <select
                              value={btn.action || 'noop'}
                              onChange={(e) => updateButton(selectedStep.id, btn.id, { action: e.target.value as any })}
                              className="admin-input"
                            >
                              <option value="noop">Нет действия</option>
                              <option value="open_catalog">Открыть каталог</option>
                              <option value="open_top_games">Открыть топ игр</option>
                              <option value="open_lab">Открыть LAB</option>
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', opacity: 0.7, fontStyle: 'italic' }}>Кнопки не добавлены</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="admin-card">
                <p style={{ textAlign: 'center', opacity: 0.7 }}>Выберите шаг для редактирования</p>
              </div>
            )}

            {/* Настройки flow */}
            <div className="admin-card" style={{ marginTop: '24px' }}>
              <h3 style={{ marginTop: 0 }}>Настройки сценария</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Название</label>
                <input
                  type="text"
                  value={currentFlow.name}
                  onChange={(e) => setCurrentFlow({ ...currentFlow, name: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Триггер</label>
                <select
                  value={currentFlow.trigger}
                  onChange={(e) => setCurrentFlow({ ...currentFlow, trigger: e.target.value as any })}
                  className="admin-input"
                >
                  <option value="start">/start</option>
                  <option value="menu">Меню</option>
                  <option value="help">/help</option>
                  <option value="custom">Кастомный</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: '500' }}>Включен</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={currentFlow.enabled}
                    onChange={(e) => setCurrentFlow({ ...currentFlow, enabled: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

