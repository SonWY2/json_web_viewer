import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: _, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-800 p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-lg mb-2">We're sorry for the inconvenience.</p>
          <details className="w-full max-w-md bg-red-100 p-4 rounded-lg overflow-auto text-sm">
            <summary className="cursor-pointer font-semibold">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
