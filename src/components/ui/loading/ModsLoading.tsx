import React from 'react';
import { SkeletonModList, SkeletonModGrid } from './Skeleton';
import { ProgressiveLoader, LoadingSpinner } from './ProgressiveLoader';
import {
  EmptyModsInstalled,
  EmptySearchResults,
  EmptyFavorites,
  EmptyUpdates,
  EmptyGameNotInstalled,
  ErrorState,
} from '../empty/EmptyState';

/**
 * Comprehensive loading and empty states for mods panel
 */

interface ModsLoadingStateProps {
  isLoading: boolean;
  isInstalled: boolean;
  view: 'grid' | 'list';
  filter: 'all' | 'installed' | 'available' | 'updates' | 'favorites';
  hasSearchQuery: boolean;
  searchQuery?: string;
  modsCount: number;
  error?: string | null;
  onBrowse?: () => void;
  onInstallGame?: () => void;
  onRetry?: () => void;
}

export function ModsLoadingState({
  isLoading,
  isInstalled,
  view,
  filter,
  hasSearchQuery,
  searchQuery = '',
  modsCount,
  error,
  onBrowse,
  onInstallGame,
  onRetry,
}: ModsLoadingStateProps) {
  // Error state
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <ProgressiveLoader
        isLoading={true}
        skeleton={
          view === 'grid' ? (
            <SkeletonModGrid count={6} />
          ) : (
            <SkeletonModList count={5} />
          )
        }
      >
        <div /> {/* Never shown during loading */}
      </ProgressiveLoader>
    );
  }

  // Empty states when not loading
  if (modsCount === 0) {
    // Game not installed
    if (!isInstalled && filter === 'installed') {
      return <EmptyGameNotInstalled onInstall={onInstallGame} />;
    }

    // Search with no results
    if (hasSearchQuery) {
      return <EmptySearchResults query={searchQuery} />;
    }

    // Filter-specific empty states
    switch (filter) {
      case 'installed':
        return <EmptyModsInstalled onBrowse={onBrowse} />;
      case 'favorites':
        return <EmptyFavorites />;
      case 'updates':
        return <EmptyUpdates />;
      default:
        return <EmptyModsInstalled onBrowse={onBrowse} />;
    }
  }

  // Should never reach here - this means content should be shown
  return null;
}

/**
 * Simple loading spinner for initial load
 */
export function ModsInitialLoading({ message = 'Loading mods...' }: { message?: string }) {
  return <LoadingSpinner message={message} size="lg" />;
}

/**
 * Inline loading for mod actions (install/uninstall)
 */
export function ModActionLoading({
  action,
  progress,
}: {
  action: 'install' | 'uninstall';
  progress?: { received: number; total: number; phase: string };
}) {
  const actionLabel = action === 'install' ? 'Installing' : 'Uninstalling';
  const phaseLabel = progress?.phase === 'extracting' ? 'Extracting' : 'Downloading';
  const percentage = progress?.total
    ? Math.min(100, Math.floor((progress.received / progress.total) * 100))
    : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="loading loading-spinner loading-xs"></div>
      <span className="text-xs">
        {progress?.phase === 'extracting' ? phaseLabel : `${phaseLabel} ${percentage}%`}
      </span>
    </div>
  );
}
