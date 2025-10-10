import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean | 'full';
  animate?: boolean;
}

/**
 * Base skeleton component for loading states
 */
export function Skeleton({
  className = '',
  width,
  height = '1rem',
  rounded = false,
  animate = true,
}: SkeletonProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : rounded ? 'rounded' : '';
  const animateClass = animate ? 'animate-pulse' : '';

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-base-300/50 ${roundedClass} ${animateClass} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton for a text line
 */
export function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? '60%' : '100%'}
          rounded
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for a card/panel
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" width="60%" rounded />
          <Skeleton height="0.75rem" width="40%" rounded />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Skeleton for a list item
 */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 glass rounded-lg ${className}`}>
      <Skeleton width={40} height={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" width="50%" rounded />
        <Skeleton height="0.75rem" width="30%" rounded />
      </div>
      <Skeleton width={80} height={32} rounded />
    </div>
  );
}

/**
 * Skeleton for a grid of items
 */
export function SkeletonGrid({
  count = 6,
  columns = 3,
  className = '',
}: {
  count?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for mod list (specific to mods panel)
 */
export function SkeletonModList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-4 flex items-start gap-4">
          {/* Mod icon */}
          <Skeleton width={64} height={64} rounded />

          <div className="flex-1 space-y-3">
            {/* Title and version */}
            <div className="space-y-2">
              <Skeleton height="1.25rem" width="70%" rounded />
              <Skeleton height="0.875rem" width="30%" rounded />
            </div>

            {/* Description */}
            <SkeletonText lines={2} />

            {/* Tags/badges */}
            <div className="flex gap-2">
              <Skeleton width={60} height={24} rounded="full" />
              <Skeleton width={80} height={24} rounded="full" />
              <Skeleton width={50} height={24} rounded="full" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Skeleton width={100} height={36} rounded />
            <Skeleton width={100} height={36} rounded />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for mod grid (specific to mods panel)
 */
export function SkeletonModGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-4 space-y-3">
          {/* Mod icon */}
          <Skeleton height={120} rounded />

          {/* Title */}
          <Skeleton height="1.25rem" width="80%" rounded />

          {/* Version */}
          <Skeleton height="0.875rem" width="40%" rounded />

          {/* Description */}
          <SkeletonText lines={2} />

          {/* Button */}
          <Skeleton height={40} rounded />
        </div>
      ))}
    </div>
  );
}
