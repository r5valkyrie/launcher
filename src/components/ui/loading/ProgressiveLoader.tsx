import React, { useState, useEffect, type ReactNode } from 'react';

interface ProgressiveLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton: ReactNode;
  delay?: number;
  minDisplayTime?: number;
}

/**
 * Progressive loader that shows skeleton with minimum display time
 * Prevents flash of loading state for fast loads
 */
export function ProgressiveLoader({
  isLoading,
  children,
  skeleton,
  delay = 200,
  minDisplayTime = 500,
}: ProgressiveLoaderProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    let minDisplayTimer: NodeJS.Timeout;

    if (isLoading) {
      // Show skeleton after delay (prevents flash for quick loads)
      delayTimer = setTimeout(() => {
        setShowSkeleton(true);
        setLoadingStartTime(Date.now());
      }, delay);
    } else {
      // Hide skeleton after minimum display time
      if (loadingStartTime) {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(0, minDisplayTime - elapsed);

        minDisplayTimer = setTimeout(() => {
          setShowSkeleton(false);
          setLoadingStartTime(null);
        }, remaining);
      } else {
        setShowSkeleton(false);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minDisplayTimer) clearTimeout(minDisplayTimer);
    };
  }, [isLoading, delay, minDisplayTime, loadingStartTime]);

  return <>{showSkeleton ? skeleton : children}</>;
}

/**
 * Staggered fade-in animation for lists
 */
export function StaggeredList({
  children,
  staggerDelay = 50,
  className = '',
}: {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationDuration: '400ms',
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Fade-in wrapper for content
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 400,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-in fade-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Loading spinner with message
 */
export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  className = '',
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = `loading-${size}`;

  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-8 ${className}`}>
      <div className={`loading loading-spinner ${sizeClass}`}></div>
      {message && <div className="text-sm opacity-70">{message}</div>}
    </div>
  );
}

/**
 * Loading overlay for full-screen loading
 */
export function LoadingOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message?: string;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass p-8 rounded-lg">
        <LoadingSpinner message={message} size="lg" />
      </div>
    </div>
  );
}
