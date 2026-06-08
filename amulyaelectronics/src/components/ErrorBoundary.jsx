import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚨</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              An error occurred while rendering this page. Check the console for details.
            </p>
            <details style={{ marginBottom: '1.5rem' }}>
              <summary style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>
                Show error details
              </summary>
              <pre style={{
                marginTop: '0.75rem',
                background: '#f3f4f6',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                color: '#dc2626',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}>
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
