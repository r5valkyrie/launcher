import { useState, useCallback } from 'react';
import {
  handleError,
  ErrorSeverity,
  retryAsync,
  getUserMessage,
  AppError,
} from '../utils/errorHandler';

/**
 * Hook for managing error state in components
 */
export function useErrorState() {
  const [error, setError] = useState<AppError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logError = useCallback(
    (message: string, options: Parameters<typeof handleError>[1] = {}) => {
      const err = handleError(message, options);
      setError(err);
      return err;
    },
    []
  );

  return {
    error,
    setError,
    clearError,
    logError,
    hasError: error !== null,
    userMessage: error?.userMessage || null,
  };
}

/**
 * Hook for safe async operations with error handling
 */
export function useSafeAsync<T>() {
  const { error, setError, clearError } = useErrorState();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (
      fn: () => Promise<T>,
      options: {
        errorMessage?: string;
        severity?: ErrorSeverity;
        onSuccess?: (result: T) => void;
        onError?: (error: AppError) => void;
      } = {}
    ): Promise<T | undefined> => {
      setLoading(true);
      clearError();

      try {
        const result = await fn();
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const appError = handleError(options.errorMessage || 'Operation failed', {
          originalError: err,
          severity: options.severity || ErrorSeverity.MEDIUM,
          userMessage: getUserMessage(err),
        });

        setError(appError);
        options.onError?.(appError);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError]
  );

  return {
    execute,
    loading,
    error,
    clearError,
    hasError: error !== null,
  };
}

/**
 * Hook for retry logic with exponential backoff
 */
export function useRetry<T>() {
  const { error, setError, clearError } = useErrorState();
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(
    async (
      fn: () => Promise<T>,
      options: {
        maxRetries?: number;
        delay?: number;
        errorMessage?: string;
        onRetry?: (attempt: number) => void;
        onSuccess?: (result: T) => void;
        onError?: (error: AppError) => void;
      } = {}
    ): Promise<T | undefined> => {
      setLoading(true);
      clearError();
      setRetryCount(0);

      try {
        const result = await retryAsync(fn, {
          maxRetries: options.maxRetries,
          delay: options.delay,
          onRetry: (attempt, err) => {
            setRetryCount(attempt);
            options.onRetry?.(attempt);
            console.log(`Retry attempt ${attempt}`, err);
          },
        });

        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const appError = handleError(options.errorMessage || 'Operation failed after retries', {
          originalError: err,
          severity: ErrorSeverity.HIGH,
          userMessage: getUserMessage(err),
          context: { retries: retryCount },
        });

        setError(appError);
        options.onError?.(appError);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, retryCount]
  );

  return {
    execute,
    loading,
    error,
    retryCount,
    clearError,
    hasError: error !== null,
  };
}

/**
 * Hook for managing multiple operation errors
 */
export function useErrorCollection() {
  const [errors, setErrors] = useState<Map<string, AppError>>(new Map());

  const addError = useCallback((key: string, error: AppError) => {
    setErrors(prev => new Map(prev).set(key, error));
  }, []);

  const removeError = useCallback((key: string) => {
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setErrors(new Map());
  }, []);

  const logError = useCallback(
    (key: string, message: string, options: Parameters<typeof handleError>[1] = {}) => {
      const err = handleError(message, options);
      addError(key, err);
      return err;
    },
    [addError]
  );

  return {
    errors: Array.from(errors.values()),
    errorMap: errors,
    hasErrors: errors.size > 0,
    addError,
    removeError,
    clearAll,
    logError,
  };
}
