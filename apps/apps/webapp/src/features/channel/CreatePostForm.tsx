// Create Post Form component - form to create a new channel post

import React, { useState, useEffect } from 'react'
import { Button } from '../../shared/ui/Button.js'
import { createChannelQueueItem } from '../../shared/api/channelQueueClient.js'
import type { ChannelConfigDTO, PostTemplateDTO } from '@asked-store/shared'

interface CreatePostFormProps {
  channelConfig: ChannelConfigDTO | null
  onPostCreated: () => void
}

export function CreatePostForm({ channelConfig, onPostCreated }: CreatePostFormProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [useDirectContent, setUseDirectContent] = useState(false)
  const [directContent, setDirectContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const templates = channelConfig?.postTemplates || []
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  // Extract variable names from template content
  useEffect(() => {
    if (selectedTemplate && !useDirectContent) {
      const varMatches = selectedTemplate.content.match(/{{(\w+)}}/g) || []
      const varNames = varMatches.map((match) => match.replace(/[{}]/g, ''))
      const newVariables: Record<string, string> = {}
      for (const varName of varNames) {
        newVariables[varName] = variables[varName] || ''
      }
      setVariables(newVariables)
    }
  }, [selectedTemplateId, useDirectContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const payload: any = {}
      
      if (useDirectContent) {
        if (!directContent.trim()) {
          throw new Error('Content is required')
        }
        payload.content = directContent
      } else {
        if (!selectedTemplateId) {
          throw new Error('Template is required')
        }
        payload.templateKey = selectedTemplateId
        payload.variables = variables
      }

      if (scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString()
      }

      await createChannelQueueItem(payload)
      setSuccess(true)
      
      // Reset form
      setSelectedTemplateId('')
      setVariables({})
      setScheduledAt('')
      setDirectContent('')
      setUseDirectContent(false)

      // Notify parent
      setTimeout(() => {
        onPostCreated()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Create Post</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Mode toggle */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useDirectContent}
              onChange={(e) => setUseDirectContent(e.target.checked)}
            />
            <span>Use direct content (instead of template)</span>
          </label>
        </div>

        {useDirectContent ? (
          /* Direct content input */
          <div style={{ marginBottom: '16px' }}>
            <label>
              <strong>Content:</strong>
              <textarea
                value={directContent}
                onChange={(e) => setDirectContent(e.target.value)}
                placeholder="Enter post content..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '8px',
                  marginTop: '4px',
                  border: '1px solid var(--tg-theme-hint-color, #ccc)',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                }}
                required
              />
            </label>
          </div>
        ) : (
          /* Template selection */
          <div style={{ marginBottom: '16px' }}>
            <label>
              <strong>Template:</strong>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px',
                  border: '1px solid var(--tg-theme-hint-color, #ccc)',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                required={!useDirectContent}
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Variable inputs */}
            {selectedTemplate && Object.keys(variables).length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <strong>Variables:</strong>
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} style={{ marginTop: '8px' }}>
                    <label>
                      {key}:
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                        placeholder={`Enter ${key}...`}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginTop: '4px',
                          border: '1px solid var(--tg-theme-hint-color, #ccc)',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule datetime */}
        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Schedule (optional):</strong>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid var(--tg-theme-hint-color, #ccc)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: 'var(--tg-theme-hint-color, #999)' }}>
              Leave empty to send immediately
            </small>
          </label>
        </div>

        {error && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--tg-theme-destructive-bg-color, #fee)', color: 'var(--tg-theme-destructive-text-color, #c33)', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--tg-theme-success-bg-color, #efe)', color: 'var(--tg-theme-success-text-color, #3c3)', borderRadius: '4px' }}>
            Post created successfully!
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </Button>
      </form>
    </div>
  )
}

