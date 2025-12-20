/**
 * Bot Flows Admin Page V2
 * Full implementation with nodes, versioning, publish/rollback, preview
 */

import { useState, useEffect, useCallback } from 'react'
import { useAdminApi } from '../../api/adminApi'
import { useTgId } from '../../hooks/useTgId'
import './AdminPages.css'

// Types
type BotFlowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type BotNodeType = 'MESSAGE' | 'MEDIA' | 'INPUT' | 'ACTION' | 'MENU'

interface BotFlowNode {
  id?: string
  title: string
  type: BotNodeType
  content: any
  keyboard?: any
  transitions?: any
  guards?: any
  effects?: any
  order: number
}

interface BotFlow {
  id: string
  key: string
  name: string
  description?: string
  status: BotFlowStatus
  version: number
  entryPoints: string[]
  startNodeId?: string
  nodes?: BotFlowNode[]
  publishedAt?: string
  updatedAt: string
  createdAt: string
}

type ViewMode = 'list' | 'edit' | 'create'

export const BotFlowsAdminPageV2: React.FC = () => {
  const api = useAdminApi()
  const tgId = useTgId()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [flows, setFlows] = useState<BotFlow[]>([])
  const [currentFlow, setCurrentFlow] = useState<BotFlow | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewState, setPreviewState] = useState<any>(null)
  const [showVersions, setShowVersions] = useState(false)

  useEffect(() => {
    if (viewMode === 'list') {
      loadFlows()
    }
  }, [viewMode])

  const loadFlows = async () => {
    setLoading(true)
    try {
      const data = await api.getBotFlows() as BotFlow[]
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
      const data = await api.getBotFlow(id) as BotFlow
      if (!data) {
        setError('Flow not found')
        return
      }
      setCurrentFlow(data)
      setSelectedNodeId(data.nodes?.[0]?.id || null)
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
      key: `flow_${Date.now()}`,
      name: 'Новый сценарий',
      status: 'DRAFT',
      version: 0,
      entryPoints: ['command:start'],
      nodes: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    setCurrentFlow(newFlow)
    setSelectedNodeId(null)
    setViewMode('create')
  }

  const handleSave = async () => {
    if (!currentFlow) return

    setError(null)
    setValidationErrors([])
    setLoading(true)

    try {
      if (!currentFlow.name.trim()) {
        setValidationErrors(['Название обязательно'])
        return
      }
      if (!currentFlow.key.trim()) {
        setValidationErrors(['Key обязательно'])
        return
      }
      if (!currentFlow.nodes || currentFlow.nodes.length === 0) {
        setValidationErrors(['Добавьте хотя бы один node'])
        setLoading(false)
        return
      }
      
      // Auto-select first node as startNodeId if not set
      let startNodeId = currentFlow.startNodeId
      if (!startNodeId && currentFlow.nodes.length > 0) {
        startNodeId = currentFlow.nodes[0].id || undefined
      }
      
      if (!startNodeId) {
        setValidationErrors(['Укажите start node или добавьте хотя бы один node'])
        setLoading(false)
        return
      }

      // Ensure entryPoints is an array
      const entryPoints = Array.isArray(currentFlow.entryPoints) 
        ? currentFlow.entryPoints 
        : currentFlow.entryPoints
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

      if (viewMode === 'create') {
        await api.createBotFlow({
          key: currentFlow.key.trim(),
          name: currentFlow.name.trim(),
          description: currentFlow.description?.trim(),
          entryPoints: entryPoints,
          startNodeId: startNodeId,
          nodes: currentFlow.nodes.map(node => ({
            id: node.id,
            title: node.title,
            type: node.type,
            content: node.content,
            keyboard: node.keyboard,
            transitions: node.transitions,
            guards: node.guards,
            effects: node.effects,
            order: node.order,
          })),
        })
      } else {
        // Ensure entryPoints is an array
        const entryPoints = Array.isArray(currentFlow.entryPoints) 
          ? currentFlow.entryPoints 
          : currentFlow.entryPoints
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        
        await api.updateBotFlow(currentFlow.id, {
          name: currentFlow.name.trim(),
          description: currentFlow.description?.trim(),
          entryPoints: entryPoints,
          startNodeId: startNodeId,
        })
        if (currentFlow.nodes) {
          await api.updateBotFlowNodes(currentFlow.id, currentFlow.nodes.map(node => ({
            id: node.id,
            title: node.title,
            type: node.type,
            content: node.content,
            keyboard: node.keyboard,
            transitions: node.transitions,
            guards: node.guards,
            effects: node.effects,
            order: node.order,
          })))
        }
      }

      setViewMode('list')
      await loadFlows()
    } catch (err: any) {
      // Extract error message from response
      let errorMessage = 'Ошибка при сохранении'
      
      if (err.response) {
        const responseData = err.response.data
        if (responseData) {
          if (typeof responseData.message === 'string') {
            errorMessage = responseData.message
          } else if (responseData.message) {
            errorMessage = JSON.stringify(responseData.message)
          } else if (typeof responseData.error === 'string') {
            errorMessage = responseData.error
          } else if (responseData.error) {
            errorMessage = JSON.stringify(responseData.error)
          } else if (typeof responseData === 'string') {
            errorMessage = responseData
          } else {
            errorMessage = JSON.stringify(responseData)
          }
        } else if (err.message) {
          errorMessage = err.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!currentFlow || !tgId) return

    setError(null)
    setValidationErrors([])
    setLoading(true)

    try {
      const result = await api.publishBotFlow(currentFlow.id, tgId) as any
      if (result.errors && result.errors.length > 0) {
        setValidationErrors(result.errors)
        return
      }
      await loadFlow(currentFlow.id)
      alert('Сценарий опубликован!')
    } catch (err: any) {
      const errorData = err.message || 'Ошибка при публикации'
      if (err.response) {
        try {
          const json = await err.response.json()
          if (json.errors) {
            setValidationErrors(json.errors)
            return
          }
        } catch {}
      }
      setError(errorData)
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async (version: number) => {
    if (!currentFlow || !tgId) return
    if (!confirm(`Откатить к версии ${version}?`)) return

    setLoading(true)
    try {
      await api.rollbackBotFlow(currentFlow.id, version, tgId)
      await loadFlow(currentFlow.id)
      alert('Откат выполнен!')
    } catch (err: any) {
      setError(err.message || 'Ошибка при откате')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    setLoading(true)
    try {
      await api.duplicateBotFlow(id)
      await loadFlows()
    } catch (err: any) {
      setError(err.message || 'Ошибка при дублировании')
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Архивировать сценарий?')) return
    setLoading(true)
    try {
      await api.archiveBotFlow(id)
      await loadFlows()
    } catch (err: any) {
      setError(err.message || 'Ошибка при архивации')
    } finally {
      setLoading(false)
    }
  }

  const addNode = () => {
    if (!currentFlow) return

    const newNode: BotFlowNode = {
      title: `Node ${(currentFlow.nodes?.length || 0) + 1}`,
      type: 'MESSAGE',
      content: { text: '' },
      keyboard: { type: 'inline', buttons: [] },
      transitions: { rules: [], fallback: null },
      guards: {},
      effects: {},
      order: currentFlow.nodes?.length || 0,
    }

    const nodeId = `node_${Date.now()}`
    setCurrentFlow({
      ...currentFlow,
      nodes: [...(currentFlow.nodes || []), { ...newNode, id: nodeId }],
      startNodeId: currentFlow.startNodeId || nodeId,
    })
    setSelectedNodeId(nodeId)
  }

  const updateNode = (nodeId: string, updates: Partial<BotFlowNode>) => {
    if (!currentFlow) return

    const updatedNodes = (currentFlow.nodes || []).map(n =>
      n.id === nodeId ? { ...n, ...updates } : n
    )

    setCurrentFlow({
      ...currentFlow,
      nodes: updatedNodes,
    })
  }

  const deleteNode = (nodeId: string) => {
    if (!currentFlow) return
    if ((currentFlow.nodes?.length || 0) <= 1) {
      alert('Нельзя удалить последний node')
      return
    }

    const updatedNodes = (currentFlow.nodes || []).filter(n => n.id !== nodeId)
    setCurrentFlow({
      ...currentFlow,
      nodes: updatedNodes,
      startNodeId: currentFlow.startNodeId === nodeId
        ? (updatedNodes[0]?.id || undefined)
        : currentFlow.startNodeId,
    })

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(updatedNodes[0]?.id || null)
    }
  }

  const selectedNode = currentFlow?.nodes?.find(n => n.id === selectedNodeId)

  // Preview
  const runPreview = async (event?: { type: 'start' | 'callback' | 'text'; value?: string }) => {
    if (!currentFlow) return

    try {
      const result = await api.previewBotFlow({
        flowId: currentFlow.id,
        version: 'draft',
        state: previewState,
        event: event || { type: 'start' },
        telegramUserId: tgId ? BigInt(tgId) : undefined,
      })
      setPreviewState(result.nextState)
      return result.botOutput
    } catch (err: any) {
      setError(err.message || 'Ошибка preview')
      return null
    }
  }

  if (viewMode === 'list') {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h2>Сценарии бота</h2>
          <button onClick={handleCreateNew} className="admin-btn admin-btn-primary">
            + Создать сценарий
          </button>
        </div>

        {error && (
          <div className="admin-error">{error}</div>
        )}

        {loading ? (
          <p>Загрузка...</p>
        ) : flows.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Сценарии не созданы</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {flows.map(flow => (
              <div key={flow.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {flow.name}
                    {flow.status === 'DRAFT' && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>(Draft)</span>}
                    {flow.status === 'PUBLISHED' && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#4caf50' }}>v{flow.version}</span>}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Entry: {flow.entryPoints.join(', ')} • Обновлён: {new Date(flow.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => loadFlow(flow.id)} className="admin-btn admin-btn-secondary">
                    ✏️ Редактировать
                  </button>
                  <button onClick={() => handleDuplicate(flow.id)} className="admin-btn admin-btn-secondary">
                    📋 Дублировать
                  </button>
                  {flow.status !== 'ARCHIVED' && (
                    <button onClick={() => handleArchive(flow.id)} className="admin-btn admin-btn-secondary">
                      📦 Архивировать
                    </button>
                  )}
                  <button onClick={() => api.deleteBotFlow(flow.id)} className="admin-btn admin-btn-secondary">
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
      <div className="admin-page-header">
        <h2>{viewMode === 'create' ? 'Создание сценария' : 'Редактирование сценария'}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowPreview(!showPreview)} className="admin-btn admin-btn-secondary">
            {showPreview ? '❌' : '👁️'} Preview
          </button>
          {currentFlow?.status === 'PUBLISHED' && (
            <button onClick={() => setShowVersions(!showVersions)} className="admin-btn admin-btn-secondary">
              📜 Версии
            </button>
          )}
          {currentFlow?.status === 'DRAFT' && viewMode === 'edit' && (
            <button onClick={handlePublish} className="admin-btn admin-btn-primary" disabled={loading}>
              🚀 Опубликовать
            </button>
          )}
          <button onClick={() => setViewMode('list')} className="admin-btn admin-btn-secondary">
            ← Назад
          </button>
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={loading}>
            💾 Сохранить
          </button>
        </div>
      </div>

      {(error || validationErrors.length > 0) && (
        <div className="admin-error">
          {error && <div>❌ {error}</div>}
          {validationErrors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Ошибки валидации:</strong>
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {currentFlow && (
        <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '300px 1fr 300px' : '300px 1fr', gap: '24px' }}>
          {/* Left: Nodes list */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Nodes</h3>
              <button onClick={addNode} className="admin-btn admin-btn-secondary" style={{ padding: '4px 8px' }}>
                + Добавить
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentFlow.nodes || []).map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id || null)}
                  style={{
                    padding: '12px',
                    background: selectedNodeId === node.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedNodeId === node.id ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid transparent',
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{node.title}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {node.type} • Order: {node.order}
                    {currentFlow.startNodeId === node.id && ' • Старт'}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentFlow({ ...currentFlow, startNodeId: node.id })
                      }}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      disabled={currentFlow.startNodeId === node.id}
                    >
                      Старт
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNode(node.id!)
                      }}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      disabled={(currentFlow.nodes?.length || 0) <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Node editor */}
          <div>
            {selectedNode ? (
              <div className="admin-card">
                <h3 style={{ marginTop: 0 }}>Редактирование node</h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Название</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => updateNode(selectedNode.id!, { title: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Тип</label>
                  <select
                    value={selectedNode.type}
                    onChange={(e) => updateNode(selectedNode.id!, { type: e.target.value as BotNodeType })}
                    className="admin-input"
                  >
                    <option value="MESSAGE">MESSAGE</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="INPUT">INPUT</option>
                    <option value="ACTION">ACTION</option>
                    <option value="MENU">MENU</option>
                  </select>
                </div>

                {selectedNode.type === 'MESSAGE' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Текст</label>
                    <textarea
                      value={selectedNode.content?.text || ''}
                      onChange={(e) => updateNode(selectedNode.id!, {
                        content: { ...selectedNode.content, text: e.target.value },
                      })}
                      className="admin-input"
                      rows={6}
                    />
                  </div>
                )}

                {/* Flow settings */}
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Key</label>
                    <input
                      type="text"
                      value={currentFlow.key}
                      onChange={(e) => setCurrentFlow({ ...currentFlow, key: e.target.value })}
                      className="admin-input"
                      disabled={viewMode === 'edit'}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Entry Points (через запятую)</label>
                    <input
                      type="text"
                      value={currentFlow.entryPoints.join(', ')}
                      onChange={(e) => {
                        const entryPointsArray = e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean)
                        setCurrentFlow({
                          ...currentFlow,
                          entryPoints: entryPointsArray,
                        })
                      }}
                      className="admin-input"
                      placeholder="command:start, callback:menu"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-card">
                <p style={{ textAlign: 'center', opacity: 0.7 }}>Выберите node для редактирования</p>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div className="admin-card">
              <h3 style={{ marginTop: 0 }}>Preview</h3>
              <button onClick={() => runPreview({ type: 'start' })} className="admin-btn admin-btn-primary" style={{ marginBottom: '16px' }}>
                Start Preview
              </button>
              {previewState && (
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  <div>Flow: {previewState.activeFlowId}</div>
                  <div>Node: {previewState.currentNodeId}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

