import React, { useState } from 'react';
import ListItemWrapper from '../ui/ListItemWrapper';

type ModsPanelProps = {
  // Tabs and view
  modsSubtab: 'installed' | 'all';
  setModsSubtab: (t: 'installed' | 'all') => void;
  modsView: 'grid' | 'list';
  setModsView: (v: 'grid' | 'list') => void;
  setModsRefreshNonce: (updater: (x: number) => number) => void;

  // Data/state
  installedMods: any[] | null;
  installedModsLoading: boolean;
  installedModsAugmented: any[];
  isInstalledModVisible: (m: any) => boolean;
  draggingModName: string | null;
  setDraggingModName: (name: string | null) => void;
  dragOverModName: string | null;
  setDragOverModName: (name: string | null) => void;
  setInstalledMods: (updater: (prev: any[] | null) => any[] | null) => void;
  channelsSettings: Record<string, any>;
  selectedChannel: string;
  installDir: string;

  // Catalog and filters
  filteredAndSortedMods: any[];
  modsCategory: 'all' | 'qol' | 'animation' | 'sound' | 'ui' | 'model' | 'cosmetic' | 'server-side' | 'client-side' | 'modpack' | 'framework' | 'map' | 'gamemode' | 'weapon' | 'legend';
  setModsCategory: (v: ModsPanelProps['modsCategory']) => void;
  modsFilter: 'all' | 'installed' | 'available' | 'updates';
  setModsFilter: (v: ModsPanelProps['modsFilter']) => void;
  modsSortBy: 'name' | 'date' | 'downloads' | 'rating';
  setModsSortBy: (v: ModsPanelProps['modsSortBy']) => void;
  modsQuery: string;
  setModsQuery: (v: string) => void;
  modsError: string | null;
  isInstalled: boolean;

  // Actions & helpers
  getModIconUrl: (name: string) => string | null | undefined;
  getLatestVersionForName: (name: string) => string | null | undefined;
  compareVersions: (a: string | null, b: string | null) => number;
  updateInstalled: (mod: any) => void;
  toggleModEnabled: (mod: any) => void;
  uninstallMod: (mod: any) => void;
  installFromAll: (m: any) => void;
  uninstallFromAll: (m: any) => void;
  updateFromAll: (m: any) => void;
  favoriteMods: Set<string>;
  toggleFavoriteMod: (id: string) => void;
  openModDetails: (pack: any) => void;
  getModCategory: (m: any) => 'qol' | 'animation' | 'sound' | 'ui' | 'model' | 'cosmetic' | 'server-side' | 'client-side' | 'modpack' | 'framework' | 'map' | 'gamemode' | 'weapon' | 'legend' | 'other' | string;
  getModTags: (m: any) => string[];
  installingMods: Record<string, 'install' | 'uninstall' | undefined>;
  modProgress: Record<string, { received: number; total: number; phase: string }>;
};

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'qol', label: 'QoL' },
  { value: 'animation', label: 'Animation' },
  { value: 'sound', label: 'Sound' },
  { value: 'ui', label: 'UI' },
  { value: 'model', label: 'Model' },
  { value: 'cosmetic', label: 'Cosmetic' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'legend', label: 'Legend' },
  { value: 'map', label: 'Map' },
  { value: 'gamemode', label: 'Gamemode' },
  { value: 'modpack', label: 'Modpack' },
  { value: 'framework', label: 'Framework' },
  { value: 'server-side', label: 'Server' },
  { value: 'client-side', label: 'Client' },
] as const;

const SORT_OPTIONS = [
  { value: 'name', label: 'A-Z' },
  { value: 'date', label: 'Recent' },
  { value: 'downloads', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' },
] as const;

const STATUS_FILTERS = [
  { value: 'all', label: 'All Mods' },
  { value: 'available', label: 'Not Installed' },
  { value: 'installed', label: 'Installed' },
  { value: 'updates', label: 'Has Updates' },
] as const;

export default function ModsPanel(props: ModsPanelProps) {
  const {
    modsSubtab,
    setModsSubtab,
    modsView,
    setModsView,
    setModsRefreshNonce,
    installedMods,
    installedModsLoading,
    installedModsAugmented,
    isInstalledModVisible,
    draggingModName,
    setDraggingModName,
    dragOverModName,
    setDragOverModName,
    setInstalledMods,
    channelsSettings,
    selectedChannel,
    installDir,
    filteredAndSortedMods,
    modsCategory,
    setModsCategory,
    modsFilter,
    setModsFilter,
    modsSortBy,
    setModsSortBy,
    modsQuery,
    setModsQuery,
    modsError,
    isInstalled,
    getModIconUrl,
    getLatestVersionForName,
    compareVersions,
    updateInstalled,
    toggleModEnabled,
    uninstallMod,
    installFromAll,
    uninstallFromAll,
    updateFromAll,
    favoriteMods,
    toggleFavoriteMod,
    openModDetails,
    getModCategory,
    getModTags,
    installingMods,
    modProgress,
  } = props;

  const [installedSearchQuery, setInstalledSearchQuery] = useState('');

  // Filter installed mods by search (computed inline to avoid dependency issues)
  const baseMods = (installedModsAugmented || []).filter(isInstalledModVisible);
  const visibleInstalledMods = installedSearchQuery.trim() 
    ? baseMods.filter(m => {
        const q = installedSearchQuery.toLowerCase();
        return String(m.name || m.id || '').toLowerCase().includes(q) ||
               String(m.description || '').toLowerCase().includes(q);
      })
    : baseMods;

  // Count mods needing updates
  const updateCount = (installedMods || []).filter(m => {
    const latest = getLatestVersionForName(m.name);
    return latest && m.version && compareVersions(m.version, latest) < 0;
  }).length;

  return (
    <div className="space-y-4 fade-in pb-6">
      {/* Main Header with Tabs */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Tab Pills */}
          <div className="flex items-center gap-1 p-1 bg-base-300/30 rounded-xl">
            <button 
              className={`relative px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                modsSubtab === 'installed' 
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-green-500/20' 
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300/50'
              }`}
              onClick={() => setModsSubtab('installed')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              Installed
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                modsSubtab === 'installed' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-base-300/50 text-base-content/60'
              }`}>
                {(installedMods || []).length}
              </span>
              {updateCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-warning-content text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {updateCount}
                </span>
              )}
            </button>
            <button 
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                modsSubtab === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-300/50'
              }`}
              onClick={() => setModsSubtab('all')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Browse
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                modsSubtab === 'all' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-base-300/50 text-base-content/60'
              }`}>
                {filteredAndSortedMods.length}
              </span>
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-base-300/30 rounded-lg">
              <button 
                className={`p-2 rounded-md transition-all ${modsView === 'grid' ? 'bg-primary text-primary-content shadow' : 'text-base-content/50 hover:text-base-content hover:bg-base-300/50'}`}
                onClick={() => setModsView('grid')}
                title="Grid View"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button 
                className={`p-2 rounded-md transition-all ${modsView === 'list' ? 'bg-primary text-primary-content shadow' : 'text-base-content/50 hover:text-base-content hover:bg-base-300/50'}`}
                onClick={() => setModsView('list')}
                title="List View"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="4" cy="6" r="1" fill="currentColor"/>
                  <circle cx="4" cy="12" r="1" fill="currentColor"/>
                  <circle cx="4" cy="18" r="1" fill="currentColor"/>
                </svg>
              </button>
            </div>
            
            {/* Refresh Button */}
            <button 
              className="btn btn-sm btn-ghost gap-2 text-base-content/70 hover:text-base-content hover:bg-base-300/50" 
              onClick={() => setModsRefreshNonce((x) => x + 1)}
              title="Refresh mod list"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Installed Mods View */}
      {modsSubtab === 'installed' && (
        <div className="space-y-4">
          {/* Search Bar for Installed */}
          <div className="glass rounded-xl p-3">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search installed mods..." 
                className="input w-full pl-12 pr-4 bg-base-300/30 border-0 focus:bg-base-300/50 transition-colors"
                value={installedSearchQuery}
                onChange={(e) => setInstalledSearchQuery(e.target.value)}
              />
              {installedSearchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-base-300/50 text-base-content/50 hover:text-base-content"
                  onClick={() => setInstalledSearchQuery('')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Installed Mods Content */}
          <div className="glass rounded-xl p-4">
            {installedModsLoading ? (
              <div className="text-center py-16">
                <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                <div className="text-sm opacity-70">Loading installed mods...</div>
              </div>
            ) : visibleInstalledMods.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                {installedSearchQuery ? (
                  <>
                    <h4 className="text-lg font-semibold mb-2">No matching mods</h4>
                    <p className="text-sm opacity-70 mb-4">No installed mods match "{installedSearchQuery}"</p>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => setInstalledSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="text-lg font-semibold mb-2">No mods installed yet</h4>
                    <p className="text-sm opacity-70 mb-6 max-w-sm mx-auto">
                      Enhance your gameplay with community-made modifications from the mod browser
                    </p>
                    <button 
                      className="btn btn-primary gap-2"
                      onClick={() => setModsSubtab('all')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      Browse Mods
                    </button>
                  </>
                )}
              </div>
            ) : modsView === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleInstalledMods.map((m, index) => {
                  const latest = getLatestVersionForName(m.name);
                  const needsUpdate = latest && m.version && compareVersions(m.version, latest) < 0;
                  const key = m.folder || m.name;
                  const category = getModCategory(m);
                  const isInstalling = installingMods[key] === 'install';
                  const isUninstalling = installingMods[key] === 'uninstall';
                  const mp = modProgress[key];
                  const pct = mp?.total ? Math.min(100, Math.floor((mp.received / mp.total) * 100)) : (mp?.phase === 'extracting' ? 100 : 0);
                  
                  return (
                    <ListItemWrapper key={m.name} itemKey={m.name} type="mod" delay={index * 30}>
                      <div
                        className={`group relative rounded-2xl overflow-hidden bg-gradient-to-b from-base-300/40 to-base-300/20 border transition-all duration-300 h-full flex flex-col ${
                          dragOverModName === m.name 
                            ? 'ring-2 ring-primary scale-[1.02] border-primary/50' 
                            : m.enabled 
                              ? 'border-emerald-500/20 hover:border-emerald-500/40' 
                              : 'border-white/5 hover:border-white/15'
                        } ${draggingModName === m.name ? 'opacity-50 scale-95' : 'hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1'}`}
                        draggable
                        onDragStart={(e) => { setDraggingModName(m.name); e.dataTransfer.setData('text/mod-name', String(m.name)); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDraggingModName(null); setDragOverModName(null); }}
                        onDragEnter={() => setDragOverModName(m.name)}
                        onDragLeave={(e) => { if ((e.target as HTMLElement).closest('[data-mod-card]')) return; setDragOverModName(null); }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => { e.preventDefault(); const name = e.dataTransfer.getData('text/mod-name'); setDragOverModName(null); if (!name || name === m.name) return; setInstalledMods((prev) => { const list = (prev || []).slice(); const fromIdx = list.findIndex(x => x.name === name); const toIdx = list.findIndex(x => x.name === m.name); if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev || []; const [item] = list.splice(fromIdx, 1); list.splice(toIdx, 0, item); (async () => { try { const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir; if (dir) await window.electronAPI?.reorderMods?.(dir, list.map(x => String(x.id || ''))); } catch {} })(); return list; }); }}
                        data-mod-card
                      >
                        {/* Image with gradient overlay */}
                        <div className="relative aspect-[16/9] bg-base-300/50 overflow-hidden flex-shrink-0">
                          {m.iconDataUrl ? (
                            <img src={m.iconDataUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : getModIconUrl(m.name || m.id) ? (
                            <img src={getModIconUrl(m.name || m.id) as string} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-base-300/80 to-base-300/40">
                              <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                              </svg>
                            </div>
                          )}
                          
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Top badges row */}
                          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {/* Enabled/Disabled indicator */}
                              <span className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                                m.enabled 
                                  ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/30' 
                                  : 'bg-black/60 text-white/50'
                              }`}>
                                {m.enabled ? 'Active' : 'Inactive'}
                              </span>
                              {needsUpdate && (
                                <span className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/90 text-white backdrop-blur-md shadow-lg shadow-amber-500/30">
                                  Update
                                </span>
                              )}
                            </div>
                            
                            {/* Drag Handle */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="p-2 rounded-lg bg-black/50 backdrop-blur-sm cursor-grab active:cursor-grabbing text-white/70 hover:text-white hover:bg-black/70 transition-colors" title="Drag to reorder">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="9" cy="6" r="1.5"/>
                                  <circle cx="15" cy="6" r="1.5"/>
                                  <circle cx="9" cy="12" r="1.5"/>
                                  <circle cx="15" cy="12" r="1.5"/>
                                  <circle cx="9" cy="18" r="1.5"/>
                                  <circle cx="15" cy="18" r="1.5"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bottom info on image */}
                          <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="font-bold text-white text-base mb-1 drop-shadow-lg line-clamp-1">
                              {String(m.name || m.id || '').replace(/_/g, ' ')}
                            </h4>
                            <div className="flex items-center gap-2 text-white/80 text-xs">
                              <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded">v{m.version || '—'}</span>
                              {needsUpdate && (
                                <>
                                  <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                  </svg>
                                  <span className="font-mono text-amber-400 bg-black/30 px-1.5 py-0.5 rounded">v{latest}</span>
                                </>
                              )}
                              <span className="text-white/30">•</span>
                              <span className="text-white/60 capitalize">{category}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content - fixed height for uniformity */}
                        <div className="p-4 flex flex-col flex-1">
                          {/* Description - fixed height area */}
                          <div className="flex-1 min-h-[2.5rem] mb-3">
                            {m.description ? (
                              <p className="text-xs text-base-content/50 line-clamp-2">{m.description}</p>
                            ) : (
                              <p className="text-xs text-base-content/30 italic">No description available</p>
                            )}
                          </div>
                          
                          {/* Actions Row */}
                          <div className="flex items-center gap-2">
                            {/* Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                              <input 
                                type="checkbox" 
                                className="toggle-switch" 
                                checked={!!m.enabled} 
                                onChange={() => toggleModEnabled(m)} 
                              />
                              <span className="text-xs opacity-50">{m.enabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                            
                            {/* Update button */}
                            {needsUpdate && (
                              <button 
                                className={`btn btn-sm btn-warning gap-1 ${isInstalling ? 'btn-disabled' : ''}`}
                                onClick={() => updateInstalled(m)}
                                disabled={isInstalling}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="17 8 12 3 7 8"/>
                                  <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                Update
                              </button>
                            )}
                            
                            {/* Uninstall */}
                            <button 
                              className={`btn btn-sm btn-ghost text-error/70 hover:text-error hover:bg-error/10 ${(!m.hasManifest || isUninstalling) ? 'btn-disabled opacity-40' : ''}`}
                              onClick={() => uninstallMod(m)}
                              disabled={!m.hasManifest || isUninstalling}
                              title="Uninstall"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Installing/Updating overlay */}
                        {isInstalling && (
                          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
                            {/* Animated icon */}
                            <div className="relative mb-4">
                              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                                <svg className={`w-8 h-8 text-white ${mp?.phase === 'extracting' ? '' : 'animate-bounce'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {mp?.phase === 'extracting' ? (
                                    <>
                                      <path d="M21 8v13H3V8"/>
                                      <path d="M1 3h22v5H1z"/>
                                      <path d="M10 12h4"/>
                                    </>
                                  ) : (
                                    <>
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7 10 12 15 17 10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </>
                                  )}
                                </svg>
                              </div>
                              {/* Pulse ring */}
                              <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ping" />
                            </div>
                            
                            {/* Status text */}
                            <div className="text-white font-semibold mb-1">
                              {mp?.phase === 'extracting' ? 'Extracting...' : 'Downloading...'}
                            </div>
                            <div className="text-white/60 text-sm mb-4">{pct}% complete</div>
                            
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-300 relative overflow-hidden"
                                style={{ width: `${pct}%` }}
                              >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Uninstalling overlay */}
                        {isUninstalling && (
                          <div className="absolute inset-0 bg-gradient-to-b from-red-900/95 via-rose-900/95 to-pink-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </div>
                            <div className="text-white font-semibold">Uninstalling...</div>
                            <div className="text-white/60 text-sm">Please wait</div>
                          </div>
                        )}
                      </div>
                    </ListItemWrapper>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleInstalledMods.map((m, index) => {
                  const latest = getLatestVersionForName(m.name);
                  const needsUpdate = latest && m.version && compareVersions(m.version, latest) < 0;
                  const key = m.folder || m.name;
                  const category = getModCategory(m);
                  const isInstalling = installingMods[key] === 'install';
                  const isUninstalling = installingMods[key] === 'uninstall';
                  const mp = modProgress[key];
                  const pct = mp?.total ? Math.min(100, Math.floor((mp.received / mp.total) * 100)) : (mp?.phase === 'extracting' ? 100 : 0);
                  
                  return (
                    <ListItemWrapper key={m.name} itemKey={m.name} type="mod" delay={index * 30}>
                      <div
                        className={`group relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r transition-all duration-200 ${
                          dragOverModName === m.name 
                            ? 'ring-2 ring-primary scale-[1.01] from-primary/10 to-primary/5' 
                            : m.enabled 
                              ? 'from-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40' 
                              : 'from-base-300/30 to-base-300/10 border border-white/5 hover:border-white/15'
                        } ${draggingModName === m.name ? 'opacity-50 scale-95' : 'hover:shadow-lg hover:shadow-black/20'}`}
                        draggable
                        onDragStart={(e) => { setDraggingModName(m.name); e.dataTransfer.setData('text/mod-name', String(m.name)); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDraggingModName(null); setDragOverModName(null); }}
                        onDragEnter={() => setDragOverModName(m.name)}
                        onDragLeave={(e) => { if ((e.target as HTMLElement).closest('[data-mod-card]')) return; setDragOverModName(null); }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => { e.preventDefault(); const name = e.dataTransfer.getData('text/mod-name'); setDragOverModName(null); if (!name || name === m.name) return; setInstalledMods((prev) => { const list = (prev || []).slice(); const fromIdx = list.findIndex(x => x.name === name); const toIdx = list.findIndex(x => x.name === m.name); if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev || []; const [item] = list.splice(fromIdx, 1); list.splice(toIdx, 0, item); (async () => { try { const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir; if (dir) await window.electronAPI?.reorderMods?.(dir, list.map(x => String(x.id || ''))); } catch {} })(); return list; }); }}
                        data-mod-card
                      >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing text-base-content/20 hover:text-base-content/50 transition-colors" title="Drag to reorder">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="9" cy="6" r="1.5"/>
                            <circle cx="15" cy="6" r="1.5"/>
                            <circle cx="9" cy="12" r="1.5"/>
                            <circle cx="15" cy="12" r="1.5"/>
                            <circle cx="9" cy="18" r="1.5"/>
                            <circle cx="15" cy="18" r="1.5"/>
                          </svg>
                        </div>
                        
                        {/* Icon with status ring */}
                        <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ${m.enabled ? 'ring-emerald-500/50' : 'ring-white/10'}`}>
                          {m.iconDataUrl ? (
                            <img src={m.iconDataUrl} alt="" className="w-full h-full object-cover" />
                          ) : getModIconUrl(m.name || m.id) ? (
                            <img src={getModIconUrl(m.name || m.id) as string} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-base-300/50">
                              <svg className="w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                              </svg>
                            </div>
                          )}
                          {/* Status dot */}
                          <div className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-base-100 ${m.enabled ? 'bg-emerald-500' : 'bg-base-content/30'}`} />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-sm truncate">{String(m.name || m.id || '').replace(/_/g, ' ')}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-base-300/50 text-base-content/50 capitalize">
                              {category}
                            </span>
                            {needsUpdate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                                Update
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-50">
                            <span className="font-mono">v{m.version || '—'}</span>
                            {needsUpdate && <span className="text-warning">→ v{latest}</span>}
                          </div>
                          {m.description && (
                            <p className="text-xs opacity-40 line-clamp-1 mt-1">{m.description}</p>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {needsUpdate && (
                            <button 
                              className={`btn btn-sm btn-warning gap-1 ${isInstalling ? 'btn-disabled' : ''}`}
                              onClick={() => updateInstalled(m)}
                              disabled={isInstalling}
                            >
                              {isInstalling ? (
                                <><span className="loading loading-spinner loading-xs"></span> {pct}%</>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                  </svg>
                                  Update
                                </>
                              )}
                            </button>
                          )}
                          <label className="cursor-pointer flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              className="toggle-switch" 
                              checked={!!m.enabled} 
                              onChange={() => toggleModEnabled(m)} 
                            />
                          </label>
                          <button 
                            className={`btn btn-sm btn-ghost text-error/60 hover:text-error hover:bg-error/10 ${(!m.hasManifest || isUninstalling) ? 'btn-disabled opacity-40' : ''}`}
                            onClick={() => uninstallMod(m)}
                            disabled={!m.hasManifest || isUninstalling}
                            title="Uninstall"
                          >
                            {isUninstalling ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Progress bar at bottom */}
                        {isInstalling && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </ListItemWrapper>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer tip */}
          {visibleInstalledMods.length > 0 && (
            <div className="text-center text-xs opacity-40 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5"/>
                <circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/>
                <circle cx="15" cy="12" r="1.5"/>
              </svg>
              Drag mods to change load order
            </div>
          )}
        </div>
      )}

      {/* Browse Mods View */}
      {modsSubtab === 'all' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="glass rounded-xl p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search by name, author, or description..." 
                className="input w-full pl-12 pr-4 bg-base-300/30 border-0 focus:bg-base-300/50 transition-colors text-base"
                value={modsQuery}
                onChange={(e) => setModsQuery(e.target.value)}
              />
              {modsQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-base-300/50 text-base-content/50 hover:text-base-content"
                  onClick={() => setModsQuery('')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent -mx-1 px-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      modsCategory === cat.value
                        ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                        : 'bg-base-300/30 text-base-content/60 hover:bg-base-300/50 hover:text-base-content'
                    }`}
                    onClick={() => setModsCategory(cat.value as any)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status & Sort Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-base-300/20 rounded-lg">
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      modsFilter === filter.value
                        ? 'bg-base-content/10 text-base-content'
                        : 'text-base-content/50 hover:text-base-content/70'
                    }`}
                    onClick={() => setModsFilter(filter.value as any)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              <div className="flex-1" />
              
              {/* Sort Options */}
              <div className="flex items-center gap-1 p-1 bg-base-300/20 rounded-lg">
                {SORT_OPTIONS.map(sort => (
                  <button
                    key={sort.value}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      modsSortBy === sort.value
                        ? 'bg-base-content/10 text-base-content'
                        : 'text-base-content/50 hover:text-base-content/70'
                    }`}
                    onClick={() => setModsSortBy(sort.value as any)}
                    title={`Sort by ${sort.label}`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error State */}
          {modsError && !filteredAndSortedMods && (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warning/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-warning">Connection Error</h4>
              <p className="text-sm opacity-70 mb-4">{modsError}</p>
              <button 
                className="btn btn-warning btn-sm"
                onClick={() => setModsRefreshNonce((x) => x + 1)}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Game Not Installed */}
          {!isInstalled && (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warning/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M6 12h.01M18 12h.01"/>
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-warning">Game Not Installed</h4>
              <p className="text-sm opacity-70">Install the selected channel before installing mods.</p>
            </div>
          )}

          {/* Mods Grid/List */}
          {isInstalled && (
            <div className="glass rounded-xl p-4">
              {filteredAndSortedMods.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-base-300/30 flex items-center justify-center">
                    <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">No mods found</h4>
                  <p className="text-sm opacity-70 mb-4">
                    {modsQuery.trim() 
                      ? `No results for "${modsQuery}"`
                      : 'No mods match the current filters'
                    }
                  </p>
                  {(modsQuery.trim() || modsCategory !== 'all' || modsFilter !== 'all') && (
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => { setModsQuery(''); setModsCategory('all'); setModsFilter('all'); }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : modsView === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedMods.slice(0, 60).map((m: any, index: number) => {
                    const latest = Array.isArray(m?.versions) && m.versions[0] ? m.versions[0] : null;
                    const rawTitle = m?.name || (m?.full_name?.split('-')?.[0]) || 'Unknown';
                    const title = String(rawTitle).replace(/_/g, ' ');
                    const ver = latest?.version_number || '';
                    const installed = (installedMods || []).find((im) => String(im.name || '').toLowerCase() === String(m?.name || '').toLowerCase());
                    const state = installed ? (compareVersions(installed?.version || null, ver) < 0 ? 'update' : 'installed') : 'not';
                    const key = (m?.full_name || m?.name || title).replace(/[^a-z0-9_\-]/gi, '_');
                    const modId = m?.uuid4 || m?.full_name || title;
                    const isFavorite = favoriteMods.has(modId);
                    const category = getModCategory(m);
                    const totalDownloads = (m?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
                    
                    return (
                      <ListItemWrapper key={modId} itemKey={modId} type="mod" delay={index * 20}>
                        <div className="group relative rounded-xl overflow-hidden bg-base-300/30 border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 flex flex-col h-full">
                          {/* Image */}
                          <div className="relative aspect-[16/10] bg-base-300/50 overflow-hidden">
                            {m?.versions?.[0]?.icon ? (
                              <img src={m.versions[0].icon} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                              </div>
                            )}
                            
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Status Badge */}
                            {state !== 'not' && (
                              <div className="absolute top-2 left-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shadow ${state === 'update' ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                                  {state === 'update' ? 'Update' : 'Installed'}
                                </span>
                              </div>
                            )}
                            
                            {/* Category */}
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white/80 capitalize">
                                {category}
                              </span>
                            </div>
                            
                            {/* Favorite Button */}
                            <button 
                              className={`absolute bottom-2 right-2 p-2 rounded-lg transition-all ${
                                isFavorite 
                                  ? 'bg-warning/90 text-warning-content' 
                                  : 'bg-black/50 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/70'
                              }`}
                              onClick={() => toggleFavoriteMod(modId)}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            </button>
                          </div>
                          
                          {/* Content */}
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">{title}</h4>
                            
                            <div className="flex items-center gap-2 text-xs opacity-50 mb-2">
                              <span>v{ver}</span>
                              {totalDownloads > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7 10 12 15 17 10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    {totalDownloads >= 1000 ? `${(totalDownloads / 1000).toFixed(1)}k` : totalDownloads}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">★ {(m?.rating_score || 0).toFixed(1)}</span>
                            </div>
                            
                            {m?.versions?.[0]?.description && (
                              <p className="text-xs opacity-60 line-clamp-2 mb-3 flex-1">{m.versions[0].description}</p>
                            )}
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-auto pt-2">
                              {state === 'not' && !installingMods[key] && (
                                <button 
                                  className="btn btn-sm btn-success flex-1 gap-1"
                                  onClick={() => installFromAll(m)}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                  Install
                                </button>
                              )}
                              {state === 'installed' && !installingMods[key] && (
                                <button 
                                  className="btn btn-sm btn-error flex-1"
                                  onClick={() => uninstallFromAll(m)}
                                >
                                  Uninstall
                                </button>
                              )}
                              {state === 'update' && !installingMods[key] && (
                                <>
                                  <button 
                                    className="btn btn-sm btn-warning flex-1"
                                    onClick={() => updateFromAll(m)}
                                  >
                                    Update
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-ghost text-error"
                                    onClick={() => uninstallFromAll(m)}
                                    title="Uninstall"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                  </button>
                                </>
                              )}
                              {!installingMods[key] && (
                                <button 
                                  className="btn btn-sm btn-ghost opacity-70 hover:opacity-100"
                                  onClick={() => openModDetails(m)}
                                  title="View details"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="16" x2="12" y2="12"/>
                                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Installing overlay */}
                          {installingMods[key] === 'install' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-green-900/95 to-teal-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-xl">
                              {(() => { 
                                const mp = modProgress[key]; 
                                const pct = mp?.total ? Math.min(100, Math.floor((mp.received / mp.total) * 100)) : (mp?.phase === 'extracting' ? 100 : 0);
                                const isExtracting = mp?.phase === 'extracting';
                                return (
                                  <>
                                    {/* Animated icon */}
                                    <div className="relative mb-3">
                                      <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                                        <svg className={`w-7 h-7 text-white ${isExtracting ? '' : 'animate-bounce'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          {isExtracting ? (
                                            <>
                                              <path d="M21 8v13H3V8"/>
                                              <path d="M1 3h22v5H1z"/>
                                              <path d="M10 12h4"/>
                                            </>
                                          ) : (
                                            <>
                                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                              <polyline points="7 10 12 15 17 10"/>
                                              <line x1="12" y1="15" x2="12" y2="3"/>
                                            </>
                                          )}
                                        </svg>
                                      </div>
                                      <div className="absolute inset-0 rounded-xl border-2 border-white/20 animate-ping" />
                                    </div>
                                    
                                    <div className="text-white font-semibold text-sm mb-0.5">
                                      {isExtracting ? 'Extracting' : 'Downloading'}
                                    </div>
                                    <div className="text-white/60 text-xs mb-3">{pct}%</div>
                                    
                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all duration-300 relative overflow-hidden"
                                        style={{ width: `${pct}%` }}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          
                          {/* Uninstalling overlay */}
                          {installingMods[key] === 'uninstall' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-900/95 via-rose-900/95 to-pink-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-xl">
                              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                                <svg className="w-7 h-7 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </div>
                              <div className="text-white font-semibold text-sm">Removing...</div>
                            </div>
                          )}
                        </div>
                      </ListItemWrapper>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2">
                  {filteredAndSortedMods.slice(0, 60).map((m: any, index: number) => {
                    const latest = Array.isArray(m?.versions) && m.versions[0] ? m.versions[0] : null;
                    const rawTitle = m?.name || (m?.full_name?.split('-')?.[0]) || 'Unknown';
                    const title = String(rawTitle).replace(/_/g, ' ');
                    const ver = latest?.version_number || '';
                    const installed = (installedMods || []).find((im) => String(im.name || '').toLowerCase() === String(m?.name || '').toLowerCase());
                    const state = installed ? (compareVersions(installed?.version || null, ver) < 0 ? 'update' : 'installed') : 'not';
                    const key = (m?.full_name || m?.name || title).replace(/[^a-z0-9_\-]/gi, '_');
                    const modId = m?.uuid4 || m?.full_name || title;
                    const isFavorite = favoriteMods.has(modId);
                    const category = getModCategory(m);
                    const totalDownloads = (m?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
                    
                    return (
                      <ListItemWrapper key={modId} itemKey={modId} type="mod" delay={index * 15}>
                        <div className="group flex items-center gap-4 p-3 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 hover:bg-base-300/30 transition-all relative">
                          {/* Icon */}
                          <div className="w-14 h-14 rounded-lg bg-base-300/50 overflow-hidden flex-shrink-0">
                            {m?.versions?.[0]?.icon ? (
                              <img src={m.versions[0].icon} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{title}</h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-base-300/50 text-base-content/50 capitalize">
                                {category}
                              </span>
                              {state === 'installed' && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">Installed</span>}
                              {state === 'update' && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">Update</span>}
                              {isFavorite && <span className="text-warning text-xs">★</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs opacity-50 mt-0.5">
                              <span>v{ver}</span>
                              {totalDownloads > 0 && <span>{totalDownloads >= 1000 ? `${(totalDownloads / 1000).toFixed(1)}k` : totalDownloads} downloads</span>}
                              <span>★ {(m?.rating_score || 0).toFixed(1)}</span>
                            </div>
                            {m?.versions?.[0]?.description && (
                              <p className="text-xs opacity-50 line-clamp-1 mt-1">{m.versions[0].description}</p>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button 
                              className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost opacity-50 hover:opacity-100'}`}
                              onClick={() => toggleFavoriteMod(modId)}
                              title={isFavorite ? 'Unfavorite' : 'Favorite'}
                            >
                              ★
                            </button>
                            
                            {/* Installing progress indicator */}
                            {installingMods[key] === 'install' && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                                {(() => {
                                  const mp = modProgress[key];
                                  const pct = mp?.total ? Math.min(100, Math.floor((mp.received / mp.total) * 100)) : (mp?.phase === 'extracting' ? 100 : 0);
                                  const isExtracting = mp?.phase === 'extracting';
                                  return (
                                    <>
                                      <svg className={`w-4 h-4 text-emerald-400 ${isExtracting ? 'animate-pulse' : 'animate-bounce'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        {isExtracting ? (
                                          <><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/></>
                                        ) : (
                                          <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>
                                        )}
                                      </svg>
                                      <span className="text-xs font-semibold text-emerald-400">{pct}%</span>
                                      <div className="w-16 h-1.5 bg-emerald-900/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                            
                            {/* Uninstalling indicator */}
                            {installingMods[key] === 'uninstall' && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30">
                                <svg className="w-4 h-4 text-red-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                <span className="text-xs font-semibold text-red-400">Removing...</span>
                              </div>
                            )}
                            
                            {!installingMods[key] && (
                              <>
                                {state === 'not' && (
                                  <button 
                                    className="btn btn-sm btn-success gap-1"
                                    onClick={() => installFromAll(m)}
                                  >
                                    Install
                                  </button>
                                )}
                                {state === 'installed' && (
                                  <button 
                                    className="btn btn-sm btn-error"
                                    onClick={() => uninstallFromAll(m)}
                                  >
                                    Uninstall
                                  </button>
                                )}
                                {state === 'update' && (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-warning"
                                      onClick={() => updateFromAll(m)}
                                    >
                                      Update
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-ghost text-error"
                                      onClick={() => uninstallFromAll(m)}
                                      title="Uninstall"
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                      </svg>
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="btn btn-sm btn-ghost opacity-60 hover:opacity-100"
                                  onClick={() => openModDetails(m)}
                                  title="Details"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="16" x2="12" y2="12"/>
                                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </ListItemWrapper>
                    );
                  })}
                </div>
              )}
              
              {/* Load more hint */}
              {filteredAndSortedMods.length > 60 && (
                <div className="text-center text-xs opacity-40 pt-4">
                  Showing 60 of {filteredAndSortedMods.length} mods. Use search or filters to find more.
                </div>
              )}
            </div>
          )}

          {/* Thunderstore Attribution */}
          <div className="text-center">
            <a 
              className="inline-flex items-center gap-2 text-xs opacity-40 hover:opacity-70 transition-opacity" 
              href="https://thunderstore.io/c/r5valkyrie" 
              target="_blank" 
              rel="noreferrer"
            >
              <span>⚡</span>
              <span>Powered by Thunderstore</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
