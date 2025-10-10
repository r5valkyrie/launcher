import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorLogger, createError, ErrorSeverity } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error
    const appError = createError('React component error', {
      originalError: error,
      severity: ErrorSeverity.HIGH,
      context: {
        componentStack: errorInfo.componentStack,
      },
      userMessage: 'A component failed to render. Please try refreshing.',
    });

    ErrorLogger.log(appError);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="glass max-w-lg w-full p-8 space-y-6">
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-error/20 p-4">
            <svg
              className="w-12 h-12 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-error">Something went wrong</h1>
          <p className="text-sm opacity-70">
            The application encountered an unexpected error and couldn't continue.
          </p>
        </div>

        {/* Error details (in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs opacity-60">
            <summary className="cursor-pointer hover:opacity-100 mb-2">
              Error details (dev only)
            </summary>
            <pre className="bg-base-300 p-3 rounded overflow-auto max-h-40">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn btn-primary">
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-outline"
          >
            Reload App
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-center opacity-50">
          If this problem persists, please report it on GitHub
        </p>
      </div>
    </div>
  );
}

/**
 * Smaller error boundary for specific sections
 */
export function SectionErrorBoundary({
  children,
  sectionName,
}: {
  children: ReactNode;
  sectionName: string;
}) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="glass rounded-lg p-6 text-center space-y-4">
          <div className="text-error">
            <svg
              className="w-10 h-10 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Error loading {sectionName}</h3>
            <p className="text-sm opacity-70">
              {process.env.NODE_ENV === 'development'
                ? error.message
                : 'An error occurred in this section'}
            </p>
          </div>

          <button onClick={reset} className="btn btn-sm btn-outline">
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
