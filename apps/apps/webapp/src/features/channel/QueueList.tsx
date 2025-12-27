// Queue List component - displays channel queue items with actions

import React, { useState } from 'react'
import { Button } from '../../shared/ui/Button.js'
import { Card } from '../../shared/ui/Card.js'
import { getChannelQueue, cancelChannelQueueItem } from '../../shared/api/channelQueueClient.js'
import type { ChannelQueueItemDTO } from '@asked-store/shared'

interface QueueListProps {
  queueItems: ChannelQueueItemDTO[]
  onRefresh: () => void
}

export function QueueList({ queueItems, onRefresh }: QueueListProps) {
  const [filter, setFilter] = useState<'all' | 'queued' | 'sent' | 'failed'>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const filteredItems = filter === 'all' 
    ? queueItems 
    : queueItems.filter((item) => item.status === filter)

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this post?')) {
      return
    }

    try {
      setCancelling(id)
      await cancelChannelQueueItem(id)
      onRefresh()
    } catch (error: any) {
      alert(`Failed to cancel: ${error.message}`)
    } finally {
      setCancelling(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'var(--tg-theme-button-color, #3390ec)'
      case 'sent':
        return 'var(--tg-theme-success-text-color, #4caf50)'
      case 'failed':
        return 'var(--tg-theme-destructive-text-color, #f44336)'
      default:
        return 'var(--tg-theme-text-color, #000)'
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Publication Queue</h2>
        <Button onClick={onRefresh}>Refresh</Button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        {(['all', 'queued', 'sent', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              borderRadius: '4px',
              background: filter === status ? 'var(--tg-theme-button-color, #3390ec)' : 'transparent',
              color: filter === status ? '#fff' : 'var(--tg-theme-text-color, #000)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Queue Items */}
      {filteredItems.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)' }}>
          No items found
        </div>
      ) : (
        filteredItems.map((item) => {
          const payload = item.payload as any
          const content = payload.content || (payload.templateKey ? `Template: ${payload.templateKey}` : 'N/A')
          
          return (
            <Card key={item.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(item.status),
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.status}
                  </span>
                  {item.messageId && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                      Message ID: {item.messageId}
                    </span>
                  )}
                </div>
                {item.status === 'queued' && (
                  <Button
                    onClick={() => handleCancel(item.id)}
                    disabled={cancelling === item.id}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    {cancelling === item.id ? 'Cancelling...' : 'Cancel'}
                  </Button>
                )}
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong>Content:</strong>
                <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {content.substring(0, 200)}{content.length > 200 ? '...' : ''}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                <div>
                  <strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}
                </div>
                {item.scheduledAt && (
                  <div>
                    <strong>Scheduled:</strong> {new Date(item.scheduledAt).toLocaleString()}
                  </div>
                )}
                {item.sentAt && (
                  <div>
                    <strong>Sent:</strong> {new Date(item.sentAt).toLocaleString()}
                  </div>
                )}
                {item.attempts > 0 && (
                  <div>
                    <strong>Attempts:</strong> {item.attempts}
                  </div>
                )}
              </div>

              {item.lastError && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--tg-theme-destructive-bg-color, #fee)', color: 'var(--tg-theme-destructive-text-color, #c33)', borderRadius: '4px', fontSize: '12px' }}>
                  <strong>Error:</strong> {item.lastError}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

