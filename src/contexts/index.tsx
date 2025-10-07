import React, { ReactNode } from 'react';
import { AppProvider } from './AppContext';
import { ChannelProvider } from './ChannelContext';
import { DownloadProvider } from './DownloadContext';
import { ModsProvider } from './ModsContext';
import { LaunchOptionsProvider } from './LaunchOptionsContext';

export { useApp } from './AppContext';
export { useChannel } from './ChannelContext';
export { useDownload } from './DownloadContext';
export { useMods } from './ModsContext';
export { useLaunchOptions } from './LaunchOptionsContext';

/**
 * Root provider that wraps all context providers
 * This ensures all contexts are available throughout the app
 */
export function LauncherProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ChannelProvider>
        <DownloadProvider>
          <ModsProvider>
            <LaunchOptionsProvider>
              {children}
            </LaunchOptionsProvider>
          </ModsProvider>
        </DownloadProvider>
      </ChannelProvider>
    </AppProvider>
  );
}
