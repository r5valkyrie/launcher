/**
 * Centralized error handling utilities
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  originalError?: Error;
  timestamp: number;
  userMessage?: string;
}

/**
 * Error logger - logs to console and optionally to file/service
 */
export class ErrorLogger {
  private static errors: AppError[] = [];
  private static maxStoredErrors = 100;

  static log(error: AppError): void {
    // Add to in-memory store
    this.errors.unshift(error);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.pop();
    }

    // Log to console based on severity
    const logMethod = this.getLogMethod(error.severity);
    const context = error.context ? `Context: ${JSON.stringify(error.context)}` : '';

    console[logMethod](
      `[${error.severity.toUpperCase()}] ${error.message}`,
      context,
      error.originalError || ''
    );

    // For critical errors, could send to external logging service
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(error);
    }
  }

  private static getLogMethod(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
    }
  }

  private static reportCriticalError(error: AppError): void {
    // Could send to Sentry, LogRocket, etc.
    // For now, just log to electron-log if available
    try {
      if (window.electronAPI) {
        // Could add IPC call to log to file
        console.error('[CRITICAL ERROR]', error);
      }
    } catch {
      // Fail silently if logging fails
    }
  }

  static getRecentErrors(count = 10): AppError[] {
    return this.errors.slice(0, count);
  }

  static clearErrors(): void {
    this.errors = [];
  }
}

/**
 * Create an AppError from a caught error
 */
export function createError(
  message: string,
  options: {
    originalError?: unknown;
    code?: string;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
    userMessage?: string;
  } = {}
): AppError {
  const {
    originalError,
    code,
    severity = ErrorSeverity.MEDIUM,
    context,
    userMessage,
  } = options;

  return {
    message,
    code,
    severity,
    context,
    originalError: originalError instanceof Error ? originalError : undefined,
    timestamp: Date.now(),
    userMessage: userMessage || message,
  };
}

/**
 * Handle and log an error
 */
export function handleError(
  message: string,
  options: Parameters<typeof createError>[1] = {}
): AppError {
  const error = createError(message, options);
  ErrorLogger.log(error);
  return error;
}

/**
 * Safe async wrapper that handles errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options: {
    errorMessage?: string;
    severity?: ErrorSeverity;
    defaultValue?: T;
    onError?: (error: AppError) => void;
  } = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    const error = createError(
      options.errorMessage || 'Async operation failed',
      {
        originalError: err,
        severity: options.severity || ErrorSeverity.MEDIUM,
      }
    );
    ErrorLogger.log(error);
    options.onError?.(error);
    return options.defaultValue;
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries - 1 || !shouldRetry(error, attempt)) {
        break;
      }

      const waitTime = delay * Math.pow(backoffMultiplier, attempt);
      onRetry?.(attempt + 1, error);

      handleError(`Retry attempt ${attempt + 1} failed, retrying in ${waitTime}ms`, {
        severity: ErrorSeverity.LOW,
        context: { attempt: attempt + 1, maxRetries, waitTime },
      });

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Network error helpers
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

export function shouldRetryNetworkError(error: unknown): boolean {
  if (!isNetworkError(error)) return false;

  // Don't retry 4xx errors (client errors)
  if (error instanceof Error && /HTTP 4\d\d/.test(error.message)) {
    return false;
  }

  return true;
}

/**
 * User-friendly error messages
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map technical errors to user-friendly messages
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return 'Network connection failed. Please check your internet connection.';
    }

    if (message.includes('permission') || message.includes('eacces')) {
      return 'Permission denied. Please check folder permissions.';
    }

    if (message.includes('enoent') || message.includes('not found')) {
      return 'File or folder not found. Please verify the path.';
    }

    if (message.includes('enospc')) {
      return 'Not enough disk space. Please free up some space and try again.';
    }

    return error.message;
  }

  return 'An unexpected error occurred';
}
