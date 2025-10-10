import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Generic empty state component
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && <div className="mb-4 opacity-40">{icon}</div>}

      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {description && (
        <p className="text-sm opacity-70 max-w-md mb-6">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary btn-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for no mods installed
 */
export function EmptyModsInstalled({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      }
      title="No mods installed"
      description="Browse the mod catalog to discover and install mods for your game."
      action={onBrowse ? {
        label: 'Browse Mods',
        onClick: onBrowse,
      } : undefined}
    />
  );
}

/**
 * Empty state for no search results
 */
export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={`No mods match "${query}". Try a different search term.`}
    />
  );
}

/**
 * Empty state for no favorite mods
 */
export function EmptyFavorites() {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      }
      title="No favorite mods"
      description="Click the heart icon on any mod to add it to your favorites."
    />
  );
}

/**
 * Empty state for no updates available
 */
export function EmptyUpdates() {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="All mods are up to date"
      description="Your installed mods are running the latest versions."
    />
  );
}

/**
 * Empty state for game not installed
 */
export function EmptyGameNotInstalled({ onInstall }: { onInstall?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="Game not installed"
      description="Install the game first to manage mods."
      action={onInstall ? {
        label: 'Install Game',
        onClick: onInstall,
      } : undefined}
    />
  );
}

/**
 * Error state component
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className = '',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 text-error opacity-60">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-error">{title}</h3>

      {description && (
        <p className="text-sm opacity-70 max-w-md mb-6">{description}</p>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-outline btn-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
