// Template List component - displays available post templates

import React from 'react'
import { Card } from '../../shared/ui/Card.js'
import type { ChannelConfigDTO } from '@asked-store/shared'

interface TemplateListProps {
  channelConfig: ChannelConfigDTO | null
}

export function TemplateList({ channelConfig }: TemplateListProps) {
  if (!channelConfig) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading channel configuration...</p>
      </div>
    )
  }

  const templates = channelConfig.postTemplates || []

  if (templates.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No templates available. Configure templates in channel settings.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Available Templates</h2>
      {templates.map((template) => (
        <Card key={template.id} style={{ marginBottom: '12px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>{template.name}</h3>
          <p style={{ margin: 0, color: 'var(--tg-theme-hint-color, #999)', whiteSpace: 'pre-wrap' }}>
            {template.content}
          </p>
          {template.buttons && template.buttons.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Buttons:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {template.buttons.map((btn, idx) => (
                  <li key={idx}>{btn.text}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

