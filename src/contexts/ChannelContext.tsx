import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Channel = {
  name: string;
  game_url: string;
  dedi_url?: string;
  enabled: boolean;
  requires_key?: boolean;
  allow_updates?: boolean;
};

type LauncherConfig = {
  launcherVersion: string;
  updaterVersion: string;
  forceUpdates: boolean;
  allowUpdates: boolean;
  backgroundVideo?: string;
  channels: Channel[];
  _offline?: boolean;
  _cachedAt?: number;
};

interface ChannelState {
  config: LauncherConfig | null;
  selectedChannel: string;
  installDir: string;
  channelsSettings: Record<string, any>;
  remoteVersion: string | null;
  installedVersion: string | null;
  isInstalled: boolean;
  primaryAction: 'install' | 'update' | 'play';
  isOfflineMode: boolean;
  offlineCachedAt: number | null;
}

interface ChannelActions {
  setConfig: (config: LauncherConfig | null) => void;
  setSelectedChannel: (channel: string) => void;
  setInstallDir: (dir: string) => void;
  setChannelsSettings: (settings: Record<string, any>) => void;
  setRemoteVersion: (version: string | null) => void;
  setInstalledVersion: (version: string | null) => void;
  setIsInstalled: (installed: boolean) => void;
  setPrimaryAction: (action: 'install' | 'update' | 'play') => void;
  setIsOfflineMode: (offline: boolean) => void;
  setOfflineCachedAt: (timestamp: number | null) => void;
  getIncludeOptional: (channelName?: string) => boolean;
  setIncludeOptional: (channelName: string, value: boolean) => Promise<void>;
}

interface ChannelContextType extends ChannelState, ChannelActions {
  enabledChannels: Channel[];
  currentChannel: Channel | undefined;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

const initialState: ChannelState = {
  config: null,
  selectedChannel: '',
  installDir: '',
  channelsSettings: {},
  remoteVersion: null,
  installedVersion: null,
  isInstalled: false,
  primaryAction: 'install',
  isOfflineMode: false,
  offlineCachedAt: null,
};

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChannelState>(initialState);

  const actions: ChannelActions = {
    setConfig: (config) => setState(prev => ({ ...prev, config })),
    setSelectedChannel: (selectedChannel) => setState(prev => ({ ...prev, selectedChannel })),
    setInstallDir: (installDir) => setState(prev => ({ ...prev, installDir })),
    setChannelsSettings: (channelsSettings) => setState(prev => ({ ...prev, channelsSettings })),
    setRemoteVersion: (remoteVersion) => setState(prev => ({ ...prev, remoteVersion })),
    setInstalledVersion: (installedVersion) => setState(prev => ({ ...prev, installedVersion })),
    setIsInstalled: (isInstalled) => setState(prev => ({ ...prev, isInstalled })),
    setPrimaryAction: (primaryAction) => setState(prev => ({ ...prev, primaryAction })),
    setIsOfflineMode: (isOfflineMode) => setState(prev => ({ ...prev, isOfflineMode })),
    setOfflineCachedAt: (offlineCachedAt) => setState(prev => ({ ...prev, offlineCachedAt })),

    getIncludeOptional: (channelName?: string) => {
      const channel = channelName || state.selectedChannel;
      const result = !!state.channelsSettings?.[channel]?.includeOptional;
      return result;
    },

    setIncludeOptional: async (channelName: string, value: boolean) => {
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      channels[channelName] = { ...(channels[channelName] || {}), includeOptional: value };
      await window.electronAPI?.setSetting('channels', channels);
      setState(prev => ({ ...prev, channelsSettings: channels }));
    },
  };

  const enabledChannels = state.config?.channels.filter(c => c.enabled) || [];
  const currentChannel = enabledChannels.find(c => c.name === state.selectedChannel);

  const value: ChannelContextType = {
    ...state,
    ...actions,
    enabledChannels,
    currentChannel,
  };

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannel() {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannel must be used within ChannelProvider');
  }
  return context;
}
