import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-loader">
          <div className="error-boundary-card card">
            <div className="error-boundary-icon">
              <AlertTriangle style={{ width: 40, height: 40, color: 'var(--color-accent-rose)' }} />
            </div>
            <h1 className="error-boundary-title">System Interruption</h1>
            <p className="error-boundary-desc">
              We've encountered an unexpected error. The intelligence intake pipeline has been paused 
              to prevent data corruption.
            </p>
            <div className="error-boundary-signal">
               <p className="error-boundary-signal-label">Technical Signal</p>
               <code className="error-boundary-code">{this.state.error?.message || 'Unknown Exception'}</code>
            </div>
            <button
              onClick={this.handleReset}
              className="btn-primary error-boundary-btn"
            >
              <RefreshCw style={{ width: 20, height: 20 }} />
              <span>Restart Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
