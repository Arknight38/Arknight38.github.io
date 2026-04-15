import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
          <div className="text-center max-w-md">
            <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--serif)', color: 'var(--rose)' }}>Something went wrong</h1>
            <p className="mb-6" style={{ color: 'var(--text2)' }}>
              The application encountered an unexpected error.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full transition-all"
              style={{
                background: 'var(--rose)',
                color: 'white',
                fontFamily: 'var(--mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
