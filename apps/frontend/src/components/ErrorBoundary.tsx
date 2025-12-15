import { Component, ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] UI crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#f5f5f5',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '12px',
              margin: '16px',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              UI crashed
            </h2>
            <p style={{ margin: '0 0 8px', fontSize: '14px', opacity: 0.8 }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reload page
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}



