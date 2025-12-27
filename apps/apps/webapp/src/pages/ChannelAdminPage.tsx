// Channel Admin Page - manage channel posts and queue

import React, { useState, useEffect } from 'react'
import { Page } from '../shared/ui/Page.js'
import { Card } from '../shared/ui/Card.js'
import { Button } from '../shared/ui/Button.js'
import { ChannelAdminGate } from '../shared/auth/ChannelAdminGate.js'
import { TemplateList } from '../features/channel/TemplateList.js'
import { CreatePostForm } from '../features/channel/CreatePostForm.js'
import { QueueList } from '../features/channel/QueueList.js'
import { getChannelConfig, getChannelQueue } from '../shared/api/channelQueueClient.js'
import type { ChannelConfigDTO, ChannelQueueItemDTO } from '@asked-store/shared'

export function ChannelAdminPage() {
  const [channelConfig, setChannelConfig] = useState<ChannelConfigDTO | null>(null)
  const [queueItems, setQueueItems] = useState<ChannelQueueItemDTO[]>([])
  const [activeTab, setActiveTab] = useState<'templates' | 'create' | 'queue'>('templates')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load channel config and queue items in parallel
      const [config, queue] = await Promise.all([
        getChannelConfig(),
        getChannelQueue(),
      ])
      
      setChannelConfig(config)
      setQueueItems(queue)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    // Refresh queue list after creating a post
    setActiveTab('queue')
    loadData()
  }

  if (loading) {
    return (
      <Page>
        <Card>
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        </Card>
      </Page>
    )
  }

  if (error) {
    return (
      <Page>
        <Card>
          <div style={{ padding: '20px', color: 'var(--tg-theme-destructive-text-color, #ff0000)' }}>
            Error: {error}
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <ChannelAdminGate>
      <Page>
        <Card>
          <h1 style={{ marginTop: 0 }}>Channel Admin</h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--tg-theme-hint-color, #999)' }}>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'templates' ? 'var(--tg-theme-button-color, #3390ec)' : 'var(--tg-theme-text-color, #000)',
                borderBottom: activeTab === 'templates' ? '2px solid var(--tg-theme-button-color, #3390ec)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('create')}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'create' ? 'var(--tg-theme-button-color, #3390ec)' : 'var(--tg-theme-text-color, #000)',
                borderBottom: activeTab === 'create' ? '2px solid var(--tg-theme-button-color, #3390ec)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Create Post
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'queue' ? 'var(--tg-theme-button-color, #3390ec)' : 'var(--tg-theme-text-color, #000)',
                borderBottom: activeTab === 'queue' ? '2px solid var(--tg-theme-button-color, #3390ec)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Queue
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'templates' && (
            <TemplateList channelConfig={channelConfig} />
          )}

          {activeTab === 'create' && (
            <CreatePostForm
              channelConfig={channelConfig}
              onPostCreated={handlePostCreated}
            />
          )}

          {activeTab === 'queue' && (
            <QueueList
              queueItems={queueItems}
              onRefresh={loadData}
            />
          )}
        </Card>
      </Page>
    </ChannelAdminGate>
  )
}

