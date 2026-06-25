import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', color: 'red' }}>
          <h2>Đã xảy ra lỗi (Crash)!</h2>
          <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '20px', border: '1px solid #ccc' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }} 
            style={{ marginTop: 20, padding: '10px 20px', fontSize: 16 }}
          >
            Xóa dữ liệu (Clear Cache) và Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
