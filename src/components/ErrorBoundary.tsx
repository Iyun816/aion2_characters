// 全局错误边界组件 - 捕获 React 渲染错误

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 生产环境可以上报错误到监控服务
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.hash = '/';
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>页面出错了</h1>
            <p style={styles.message}>
              抱歉，页面遇到了一些问题。请尝试刷新页面或返回首页。
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={styles.errorDetail}>
                {this.state.error.message}
              </pre>
            )}
            <div style={styles.actions}>
              <button style={styles.button} onClick={this.handleReload}>
                刷新页面
              </button>
              <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={this.handleGoHome}>
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#1a1a2e',
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px',
  },
  title: {
    fontSize: '24px',
    color: '#e0e0e0',
    marginBottom: '16px',
  },
  message: {
    fontSize: '16px',
    color: '#a0a0a0',
    marginBottom: '24px',
    lineHeight: 1.6,
  },
  errorDetail: {
    backgroundColor: '#2a2a3e',
    padding: '12px',
    borderRadius: '8px',
    color: '#ff6b6b',
    fontSize: '14px',
    textAlign: 'left',
    overflow: 'auto',
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#5d8a66',
    color: '#fff',
    transition: 'opacity 0.2s',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    border: '1px solid #5d8a66',
    color: '#5d8a66',
  },
};

export default ErrorBoundary;
