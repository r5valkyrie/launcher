import React from 'react';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline error display for contextual errors
 */
export function InlineError({
  message,
  onRetry,
  onDismiss,
  className = '',
}: InlineErrorProps) {
  return (
    <div
      className={`alert alert-error shadow-lg ${className}`}
      role="alert"
    >
      <div className="flex-1 flex items-start gap-3">
        <svg
          className="w-6 h-6 flex-shrink-0"
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
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-sm btn-ghost">
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn btn-sm btn-ghost btn-circle"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Warning message (less severe than error)
 */
export function InlineWarning({
  message,
  onDismiss,
  className = '',
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`alert alert-warning shadow-lg ${className}`} role="alert">
      <div className="flex-1 flex items-start gap-3">
        <svg
          className="w-6 h-6 flex-shrink-0"
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
        <p className="text-sm">{message}</p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="btn btn-sm btn-ghost btn-circle"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Success message
 */
export function InlineSuccess({
  message,
  onDismiss,
  className = '',
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`alert alert-success shadow-lg ${className}`} role="alert">
      <div className="flex-1 flex items-start gap-3">
        <svg
          className="w-6 h-6 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">{message}</p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="btn btn-sm btn-ghost btn-circle"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Compact inline error for forms
 */
export function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-error text-sm mt-1">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
