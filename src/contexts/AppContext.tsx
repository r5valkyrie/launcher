import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  appVersion: string;
  activeTab: 'general' | 'launch' | 'mods' | 'settings';
  concurrency: number;
  partConcurrency: number;
  bannerVideoEnabled: boolean;
  emojiMode: boolean;
  versionClickCount: number;
  easterEggDiscovered: boolean;
}

interface AppActions {
  setAppVersion: (version: string) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setConcurrency: (concurrency: number) => void;
  setPartConcurrency: (partConcurrency: number) => void;
  setBannerVideoEnabled: (enabled: boolean) => void;
  setEmojiMode: (enabled: boolean) => void;
  setVersionClickCount: (count: number) => void;
  setEasterEggDiscovered: (discovered: boolean) => void;
  incrementVersionClick: () => void;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  appVersion: '',
  activeTab: 'general',
  concurrency: 8,
  partConcurrency: 6,
  bannerVideoEnabled: true,
  emojiMode: false,
  versionClickCount: 0,
  easterEggDiscovered: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const actions: AppActions = {
    setAppVersion: (appVersion) => setState(prev => ({ ...prev, appVersion })),
    setActiveTab: (activeTab) => setState(prev => ({ ...prev, activeTab })),
    setConcurrency: (concurrency) => setState(prev => ({ ...prev, concurrency })),
    setPartConcurrency: (partConcurrency) => setState(prev => ({ ...prev, partConcurrency })),
    setBannerVideoEnabled: (bannerVideoEnabled) => setState(prev => ({ ...prev, bannerVideoEnabled })),
    setEmojiMode: (emojiMode) => setState(prev => ({ ...prev, emojiMode })),
    setVersionClickCount: (versionClickCount) => setState(prev => ({ ...prev, versionClickCount })),
    setEasterEggDiscovered: (easterEggDiscovered) => setState(prev => ({ ...prev, easterEggDiscovered })),
    incrementVersionClick: () => setState(prev => ({ ...prev, versionClickCount: prev.versionClickCount + 1 })),
  };

  const value: AppContextType = {
    ...state,
    ...actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
