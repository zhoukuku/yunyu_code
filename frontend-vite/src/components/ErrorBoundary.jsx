import { Component } from 'react';
import { Button, Result } from 'antd';

/**
 * Error Boundary component -- catches render-time errors in child components
 * and displays a user-friendly fallback UI instead of a white screen.
 *
 * Does NOT catch:
 * - Event handler errors (use try/catch inside handlers)
 * - Async code (promise rejections -- handled by window 'unhandledrejection')
 * - Errors thrown in the error boundary itself
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    console.error('[ErrorBoundary] Caught render error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback was provided, use it
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              error: this.state.error,
              errorInfo: this.state.errorInfo,
              retry: this.handleRetry,
            })
          : this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: this.props.minHeight ?? 400,
            padding: 24,
          }}
        >
          <Result
            status="error"
            title="页面出现了异常"
            subTitle={
              process.env.NODE_ENV === 'development'
                ? this.state.error?.message || '未知错误'
                : '抱歉，页面加载时发生了一个错误。请尝试刷新页面重试。'
            }
            extra={[
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                重试
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                返回首页
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <strong>Error Stack:</strong>
                {'\n'}
                {this.state.error?.stack || this.state.error?.message}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\n'}
                    <strong>Component Stack:</strong>
                    {'\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
