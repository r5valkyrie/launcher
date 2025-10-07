import React, { createContext, useContext, useState, ReactNode } from 'react';

type LaunchMode = 'HOST' | 'JOIN' | 'SERVER';

interface LaunchOptionsState {
  launchMode: LaunchMode;
  hostname: string;
  visibility: number;
  windowed: boolean;
  borderless: boolean;
  maxFps: string;
  resW: string;
  resH: string;
  reservedCores: string;
  workerThreads: string;
  encryptPackets: boolean;
  randomNetkey: boolean;
  queuedPackets: boolean;
  noTimeout: boolean;
  showConsole: boolean;
  colorConsole: boolean;
  playlistFile: string;
  mapIndex: number;
  playlistIndex: number;
  enableDeveloper: boolean;
  enableCheats: boolean;
  offlineMode: boolean;
  noAsync: boolean;
  discordRichPresence: boolean;
  customCmd: string;
  linuxWinePfx: string;
  selectedProtonVersion: string;
}

interface LaunchOptionsActions {
  setLaunchMode: (mode: LaunchMode) => void;
  setHostname: (hostname: string) => void;
  setVisibility: (visibility: number) => void;
  setWindowed: (windowed: boolean) => void;
  setBorderless: (borderless: boolean) => void;
  setMaxFps: (fps: string) => void;
  setResW: (width: string) => void;
  setResH: (height: string) => void;
  setReservedCores: (cores: string) => void;
  setWorkerThreads: (threads: string) => void;
  setEncryptPackets: (encrypt: boolean) => void;
  setRandomNetkey: (random: boolean) => void;
  setQueuedPackets: (queued: boolean) => void;
  setNoTimeout: (noTimeout: boolean) => void;
  setShowConsole: (show: boolean) => void;
  setColorConsole: (color: boolean) => void;
  setPlaylistFile: (file: string) => void;
  setMapIndex: (index: number) => void;
  setPlaylistIndex: (index: number) => void;
  setEnableDeveloper: (enable: boolean) => void;
  setEnableCheats: (enable: boolean) => void;
  setOfflineMode: (offline: boolean) => void;
  setNoAsync: (noAsync: boolean) => void;
  setDiscordRichPresence: (enable: boolean) => void;
  setCustomCmd: (cmd: string) => void;
  setLinuxWinePfx: (pfx: string) => void;
  setSelectedProtonVersion: (version: string) => void;
}

type LaunchOptionsContextType = LaunchOptionsState & LaunchOptionsActions;

const LaunchOptionsContext = createContext<LaunchOptionsContextType | undefined>(undefined);

const initialState: LaunchOptionsState = {
  launchMode: 'HOST',
  hostname: '',
  visibility: 0,
  windowed: false,
  borderless: false,
  maxFps: '',
  resW: '',
  resH: '',
  reservedCores: '-1',
  workerThreads: '-1',
  encryptPackets: true,
  randomNetkey: true,
  queuedPackets: true,
  noTimeout: false,
  showConsole: false,
  colorConsole: true,
  playlistFile: 'playlists_r5_patch.txt',
  mapIndex: 0,
  playlistIndex: 0,
  enableDeveloper: false,
  enableCheats: false,
  offlineMode: false,
  noAsync: false,
  discordRichPresence: true,
  customCmd: '',
  linuxWinePfx: '',
  selectedProtonVersion: '',
};

export function LaunchOptionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LaunchOptionsState>(initialState);

  const actions: LaunchOptionsActions = {
    setLaunchMode: (launchMode) => setState(prev => ({ ...prev, launchMode })),
    setHostname: (hostname) => setState(prev => ({ ...prev, hostname })),
    setVisibility: (visibility) => setState(prev => ({ ...prev, visibility })),
    setWindowed: (windowed) => setState(prev => ({ ...prev, windowed })),
    setBorderless: (borderless) => setState(prev => ({ ...prev, borderless })),
    setMaxFps: (maxFps) => setState(prev => ({ ...prev, maxFps })),
    setResW: (resW) => setState(prev => ({ ...prev, resW })),
    setResH: (resH) => setState(prev => ({ ...prev, resH })),
    setReservedCores: (reservedCores) => setState(prev => ({ ...prev, reservedCores })),
    setWorkerThreads: (workerThreads) => setState(prev => ({ ...prev, workerThreads })),
    setEncryptPackets: (encryptPackets) => setState(prev => ({ ...prev, encryptPackets })),
    setRandomNetkey: (randomNetkey) => setState(prev => ({ ...prev, randomNetkey })),
    setQueuedPackets: (queuedPackets) => setState(prev => ({ ...prev, queuedPackets })),
    setNoTimeout: (noTimeout) => setState(prev => ({ ...prev, noTimeout })),
    setShowConsole: (showConsole) => setState(prev => ({ ...prev, showConsole })),
    setColorConsole: (colorConsole) => setState(prev => ({ ...prev, colorConsole })),
    setPlaylistFile: (playlistFile) => setState(prev => ({ ...prev, playlistFile })),
    setMapIndex: (mapIndex) => setState(prev => ({ ...prev, mapIndex })),
    setPlaylistIndex: (playlistIndex) => setState(prev => ({ ...prev, playlistIndex })),
    setEnableDeveloper: (enableDeveloper) => setState(prev => ({ ...prev, enableDeveloper })),
    setEnableCheats: (enableCheats) => setState(prev => ({ ...prev, enableCheats })),
    setOfflineMode: (offlineMode) => setState(prev => ({ ...prev, offlineMode })),
    setNoAsync: (noAsync) => setState(prev => ({ ...prev, noAsync })),
    setDiscordRichPresence: (discordRichPresence) => setState(prev => ({ ...prev, discordRichPresence })),
    setCustomCmd: (customCmd) => setState(prev => ({ ...prev, customCmd })),
    setLinuxWinePfx: (linuxWinePfx) => setState(prev => ({ ...prev, linuxWinePfx })),
    setSelectedProtonVersion: (selectedProtonVersion) => setState(prev => ({ ...prev, selectedProtonVersion })),
  };

  const value: LaunchOptionsContextType = {
    ...state,
    ...actions,
  };

  return <LaunchOptionsContext.Provider value={value}>{children}</LaunchOptionsContext.Provider>;
}

export function useLaunchOptions() {
  const context = useContext(LaunchOptionsContext);
  if (!context) {
    throw new Error('useLaunchOptions must be used within LaunchOptionsProvider');
  }
  return context;
}
