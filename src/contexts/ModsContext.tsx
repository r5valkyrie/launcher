import React, { createContext, useContext, useState, ReactNode } from 'react';

type InstalledMod = {
  id: string;
  name: string;
  folder: string;
  version: string | null;
  description: string;
  enabled: boolean;
  hasManifest: boolean;
  iconDataUrl: string | null;
};

interface ModsState {
  modsSubtab: 'installed' | 'all';
  installedMods: InstalledMod[] | null;
  installedModsLoading: boolean;
  allMods: any[] | null;
  allModsLoading: boolean;
  modsQuery: string;
  modsError: string | null;
  modsRefreshNonce: number;
  installingMods: Record<string, 'install' | 'uninstall' | undefined>;
  modProgress: Record<string, { received: number; total: number; phase: string }>;
  modsShowDeprecated: boolean;
  modsShowNsfw: boolean;
  modsView: 'grid' | 'list';
  modsCategory: 'all' | 'weapons' | 'maps' | 'ui' | 'gameplay' | 'audio';
  modsSortBy: 'name' | 'date' | 'downloads' | 'rating';
  modsFilter: 'all' | 'installed' | 'available' | 'updates' | 'favorites';
  favoriteMods: Set<string>;
  draggingModName: string | null;
  dragOverModName: string | null;
  modDetailsOpen: boolean;
  modDetailsPack: any | null;
}

interface ModsActions {
  setModsSubtab: (tab: ModsState['modsSubtab']) => void;
  setInstalledMods: (mods: InstalledMod[] | null) => void;
  setInstalledModsLoading: (loading: boolean) => void;
  setAllMods: (mods: any[] | null) => void;
  setAllModsLoading: (loading: boolean) => void;
  setModsQuery: (query: string) => void;
  setModsError: (error: string | null) => void;
  setModsRefreshNonce: (nonce: number) => void;
  setInstallingMods: (mods: ModsState['installingMods']) => void;
  setModProgress: (progress: ModsState['modProgress']) => void;
  setModsShowDeprecated: (show: boolean) => void;
  setModsShowNsfw: (show: boolean) => void;
  setModsView: (view: ModsState['modsView']) => void;
  setModsCategory: (category: ModsState['modsCategory']) => void;
  setModsSortBy: (sort: ModsState['modsSortBy']) => void;
  setModsFilter: (filter: ModsState['modsFilter']) => void;
  setFavoriteMods: (mods: Set<string>) => void;
  setDraggingModName: (name: string | null) => void;
  setDragOverModName: (name: string | null) => void;
  setModDetailsOpen: (open: boolean) => void;
  setModDetailsPack: (pack: any | null) => void;
  toggleFavoriteMod: (modName: string) => void;
}

type ModsContextType = ModsState & ModsActions;

const ModsContext = createContext<ModsContextType | undefined>(undefined);

const initialState: ModsState = {
  modsSubtab: 'all',
  installedMods: null,
  installedModsLoading: false,
  allMods: null,
  allModsLoading: false,
  modsQuery: '',
  modsError: null,
  modsRefreshNonce: 0,
  installingMods: {},
  modProgress: {},
  modsShowDeprecated: false,
  modsShowNsfw: false,
  modsView: 'grid',
  modsCategory: 'all',
  modsSortBy: 'name',
  modsFilter: 'all',
  favoriteMods: new Set(),
  draggingModName: null,
  dragOverModName: null,
  modDetailsOpen: false,
  modDetailsPack: null,
};

export function ModsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModsState>(initialState);

  const actions: ModsActions = {
    setModsSubtab: (modsSubtab) => setState(prev => ({ ...prev, modsSubtab })),
    setInstalledMods: (installedMods) => setState(prev => ({ ...prev, installedMods })),
    setInstalledModsLoading: (installedModsLoading) => setState(prev => ({ ...prev, installedModsLoading })),
    setAllMods: (allMods) => setState(prev => ({ ...prev, allMods })),
    setAllModsLoading: (allModsLoading) => setState(prev => ({ ...prev, allModsLoading })),
    setModsQuery: (modsQuery) => setState(prev => ({ ...prev, modsQuery })),
    setModsError: (modsError) => setState(prev => ({ ...prev, modsError })),
    setModsRefreshNonce: (modsRefreshNonce) => setState(prev => ({ ...prev, modsRefreshNonce })),
    setInstallingMods: (installingMods) => setState(prev => ({ ...prev, installingMods })),
    setModProgress: (modProgress) => setState(prev => ({ ...prev, modProgress })),
    setModsShowDeprecated: (modsShowDeprecated) => setState(prev => ({ ...prev, modsShowDeprecated })),
    setModsShowNsfw: (modsShowNsfw) => setState(prev => ({ ...prev, modsShowNsfw })),
    setModsView: (modsView) => setState(prev => ({ ...prev, modsView })),
    setModsCategory: (modsCategory) => setState(prev => ({ ...prev, modsCategory })),
    setModsSortBy: (modsSortBy) => setState(prev => ({ ...prev, modsSortBy })),
    setModsFilter: (modsFilter) => setState(prev => ({ ...prev, modsFilter })),
    setFavoriteMods: (favoriteMods) => setState(prev => ({ ...prev, favoriteMods })),
    setDraggingModName: (draggingModName) => setState(prev => ({ ...prev, draggingModName })),
    setDragOverModName: (dragOverModName) => setState(prev => ({ ...prev, dragOverModName })),
    setModDetailsOpen: (modDetailsOpen) => setState(prev => ({ ...prev, modDetailsOpen })),
    setModDetailsPack: (modDetailsPack) => setState(prev => ({ ...prev, modDetailsPack })),
    toggleFavoriteMod: (modName: string) => {
      setState(prev => {
        const newFavorites = new Set(prev.favoriteMods);
        if (newFavorites.has(modName)) {
          newFavorites.delete(modName);
        } else {
          newFavorites.add(modName);
        }
        return { ...prev, favoriteMods: newFavorites };
      });
    },
  };

  const value: ModsContextType = {
    ...state,
    ...actions,
  };

  return <ModsContext.Provider value={value}>{children}</ModsContext.Provider>;
}

export function useMods() {
  const context = useContext(ModsContext);
  if (!context) {
    throw new Error('useMods must be used within ModsProvider');
  }
  return context;
}
