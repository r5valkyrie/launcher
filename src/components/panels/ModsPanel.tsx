import React from 'react';

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

  return (
    <div className="space-y-6 fade-in pb-6">

      {modsSubtab === 'installed' && (
        <div className="glass rounded-xl p-4">
          <div className="relative mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white text-sm">📦</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Installed Mods</h3>
                <p className="text-xs opacity-70">Manage your installed modifications</p>
              </div>
            </div>

            {/* Centered Tabs */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex bg-base-200/30 rounded-lg p-1 border border-white/10">
                <button 
                  className="relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-primary text-primary-content shadow-sm"
                  disabled
                >
                  Installed
                  <div className="badge badge-neutral badge-xs ml-2">{(installedMods || []).length}</div>
                </button>
                <button 
                  className="relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                  onClick={()=>setModsSubtab('all')}
                >
                  Browse
                  <div className="badge badge-ghost badge-xs ml-2">{filteredAndSortedMods.length}</div>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
              {/* View Controls */}
              <div className="flex gap-1 p-1 bg-base-200/50 rounded-lg">
                <button 
                  className={`btn btn-sm ${modsView === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setModsView('grid')}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button 
                  className={`btn btn-sm ${modsView === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setModsView('list')}
                  title="List View"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <button 
                className="btn btn-primary btn-sm gap-2" 
                onClick={()=> setModsRefreshNonce((x)=>x+1)}
                title="Refresh mod list"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>


          <div className="divider divider-horizontal opacity-30 my-6"></div>
          
          <div className="space-y-3">
            {installedModsLoading && (
              <div className="text-center py-8">
                <div className="loading loading-spinner loading-md mb-4"></div>
                <div className="text-sm opacity-70">Loading installed mods...</div>
              </div>
            )}
            {!installedModsLoading && (installedModsAugmented||[]).filter(isInstalledModVisible).map((m) => (
            <div
              key={m.name}
              className={`glass-soft rounded-lg border border-white/10 relative transition-transform duration-150 ${dragOverModName===m.name?'ring-1 ring-primary scale-[1.01]':''} ${draggingModName===m.name?'opacity-60':''}`}
              draggable
              onDragStart={(e)=>{ setDraggingModName(m.name); e.dataTransfer.setData('text/mod-name', String(m.name)); e.dataTransfer.effectAllowed='move'; }}
              onDragEnd={()=>{ setDraggingModName(null); setDragOverModName(null); }}
              onDragEnter={()=> setDragOverModName(m.name)}
              onDragLeave={(e)=>{ if ((e.target as HTMLElement).closest('[data-mod-card]')) return; setDragOverModName(null); }}
              onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; }}
              onDrop={(e)=>{ e.preventDefault(); const name=e.dataTransfer.getData('text/mod-name'); setDragOverModName(null); if(!name||name===m.name) return; setInstalledMods((prev)=>{ const list=(prev||[]).slice(); const fromIdx=list.findIndex(x=>x.name===name); const toIdx=list.findIndex(x=>x.name===m.name); if(fromIdx<0||toIdx<0||fromIdx===toIdx) return prev||[]; const [item]=list.splice(fromIdx,1); list.splice(toIdx,0,item); (async()=>{ try { const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir; if (dir) await window.electronAPI?.reorderMods?.(dir, list.map(x=>String(x.id||''))); } catch{} })(); return list; }); }}
              data-mod-card
            >
              <div className="flex items-stretch min-h-[96px]">
                <div className="w-28 bg-base-300/40 flex items-center justify-center overflow-hidden">
                  {m as any && (m as any).iconDataUrl ? (
                    <img src={(m as any).iconDataUrl} alt="" className="w-full h-full object-cover rounded-l-[var(--panel-radius)]" />
                  ) : getModIconUrl(m.name || m.id) ? (
                    <img src={getModIconUrl(m.name || m.id) as string} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="flex-1 p-3 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{String(m.name || m.id || '').replace(/_/g, ' ')}</div>
                      <div className="text-[11px] opacity-60 truncate">Installed: {m.version || '—'}{(() => { const lv = getLatestVersionForName(m.name); return lv && m.version && compareVersions(m.version, lv) < 0 ? ` • Latest: ${lv}` : ''; })()}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {(() => { const latest = getLatestVersionForName(m.name); const needs = latest && m.version && compareVersions(m.version, latest) < 0; const key = (m.folder || m.name); if (needs) return (
                        <button className={`btn btn-md btn-warning ${installingMods[key]==='install'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=> updateInstalled(m)}>
                          {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                        </button>
                      ); return null; })()}
                      <label className="label cursor-pointer gap-2">
                        <input type="checkbox" className="toggle-switch" checked={!!m.enabled} onChange={()=>toggleModEnabled(m)} />
                      </label>
                      {(() => { const key = (m.folder || m.name); return (
                        <div className="tooltip tooltip-error tooltip-top z-20" data-tip="Uninstall">
                          <button className={`btn btn-md btn-error ${(!m.hasManifest || installingMods[key]==='uninstall')?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>uninstallMod(m)} disabled={!m.hasManifest}>
                            <span className="text-xl leading-none">🗑</span>
                          </button>
                        </div>
                      ); })()}
                      <div className="cursor-grab active:cursor-grabbing select-none opacity-70 text-2xl ml-1" title="Drag to reorder">≡</div>
                    </div>
                  </div>
                  {m.description && <div className="text-xs opacity-70 mt-2 line-clamp-2">{m.description}</div>}
                </div>
              </div>
              {(() => { const key = (m.folder || m.name); if (installingMods[key]==='install') return (
                <div className="absolute bottom-0 right-2 left-30 m-0 p-0">
                  {(() => { const mp = modProgress[key]; const pct = mp?.total ? Math.min(100, Math.floor((mp.received/mp.total)*100)) : (mp?.phase==='extracting' ? 100 : 0); const phaseLabel = mp?.phase==='extracting' ? 'Extracting' : 'Downloading'; return (
                    <>
                      <div className="flex items-center justify-between text-[10px] opacity-80 leading-none mb-0">
                        <span>{phaseLabel}</span>
                        <span>{pct}%</span>
                      </div>
                      <progress className="progress progress-primary progress-xs w-full rounded-none m-0" value={pct} max={100}></progress>
                    </>
                  ); })()}
                </div>
              ); return null; })()}
            </div>
            ))}
            {!installedModsLoading && (installedModsAugmented||[]).length===0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h4 className="text-lg font-semibold mb-2">No mods installed</h4>
                <p className="text-sm opacity-70 mb-4">Browse the mod catalog to discover and install modifications</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setModsSubtab('all')}
                >
                  Browse Mods
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modsSubtab === 'all' && (
        <div className="glass rounded-xl p-4">
          <div className="relative mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-sm">🌐</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Browse Mods</h3>
                <p className="text-xs opacity-70">Discover and install community modifications</p>
              </div>
            </div>

            {/* Centered Tabs */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex bg-base-200/30 rounded-lg p-1 border border-white/10">
                <button 
                  className="relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                  onClick={()=>setModsSubtab('installed')}
                >
                  Installed
                  <div className="badge badge-ghost badge-xs ml-2">{(installedMods || []).length}</div>
                </button>
                <button 
                  className="relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-primary text-primary-content shadow-sm"
                  disabled
                >
                  Browse
                  <div className="badge badge-neutral badge-xs ml-2">{filteredAndSortedMods.length}</div>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
              {/* View Controls */}
              <div className="flex gap-1 p-1 bg-base-200/50 rounded-lg">
                <button 
                  className={`btn btn-sm ${modsView === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setModsView('grid')}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button 
                  className={`btn btn-sm ${modsView === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setModsView('list')}
                  title="List View"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <button 
                className="btn btn-primary btn-sm gap-2" 
                onClick={()=> setModsRefreshNonce((x)=>x+1)}
                title="Refresh mod list"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Filters & Search Section */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select 
                  className="select select-bordered w-full"
                  value={modsCategory}
                  onChange={(e) => setModsCategory(e.target.value as any)}
                >
                  <option value="all">All Categories</option>
                  <option value="qol">QoL</option>
                  <option value="animation">Animation</option>
                  <option value="sound">Sound</option>
                  <option value="ui">UI</option>
                  <option value="model">Model</option>
                  <option value="cosmetic">Cosmetic</option>
                  <option value="server-side">Server-side</option>
                  <option value="client-side">Client-side</option>
                  <option value="modpack">Modpack</option>
                  <option value="framework">Framework</option>
                  <option value="map">Map</option>
                  <option value="gamemode">Gamemode</option>
                  <option value="weapon">Weapon</option>
                  <option value="legend">Legend</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select 
                  className="select select-bordered w-full"
                  value={modsFilter}
                  onChange={(e) => setModsFilter(e.target.value as any)}
                >
                  <option value="all">All Mods</option>
                  <option value="available">Available</option>
                  <option value="installed">Installed</option>
                  <option value="updates">Need Updates</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select 
                  className="select select-bordered w-full"
                  value={modsSortBy}
                  onChange={(e) => setModsSortBy(e.target.value as any)}
                >
                  <option value="name">Name</option>
                  <option value="date">Date Added</option>
                  <option value="downloads">Downloads</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            <div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search mods by name, author, or description..." 
                  className="input input-bordered w-full pr-10"
                  value={modsQuery}
                  onChange={(e) => setModsQuery(e.target.value)}
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
            </div>
          </div>

          {modsError && !filteredAndSortedMods && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚠️</div>
              <h4 className="text-lg font-semibold mb-2 text-warning">Connection Error</h4>
              <p className="text-sm opacity-80 mb-4">{modsError}</p>
              <button 
                className="btn btn-warning btn-sm"
                onClick={() => setModsRefreshNonce((x) => x + 1)}
              >
                Try Again
              </button>
            </div>
          )}

          {!isInstalled && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎮</div>
              <h4 className="text-lg font-semibold mb-2 text-warning">Game Not Installed</h4>
              <p className="text-sm opacity-80">Install the selected channel before installing mods.</p>
            </div>
          )}

          {isInstalled && (
            <>
              {modsView === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedMods.slice(0, 60).map((m: any) => {
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
                    const tags = getModTags(m);
                    
                    return (
                      <div key={modId} className="group glass-soft rounded-lg border border-white/10 relative hover:border-primary/30 transition-all hover:shadow-lg flex flex-col h-full">
                        <div className="relative w-full pb-[50%] bg-base-300/40 overflow-hidden rounded-t-lg">
                          {m?.versions?.[0]?.icon ? (
                            <img src={m.versions[0].icon} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                              📦
                            </div>
                          )}
                          
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-1rem)]">
                            {tags.length > 0 ? (
                              tags.map((tag, idx) => (
                                <span key={idx} className="badge badge-xs bg-black/50 text-white border-white/20">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className={`badge badge-sm ${
                                category === 'weapon' ? 'badge-error' : 
                                category === 'map' ? 'badge-info' : 
                                category === 'ui' ? 'badge-warning' : 
                                category === 'gamemode' ? 'badge-success' : 
                                category === 'sound' ? 'badge-secondary' : 
                                category === 'animation' ? 'badge-accent' :
                                category === 'qol' ? 'badge-primary' :
                                'badge-neutral'
                              }`}>
                                {category === 'qol' ? 'QoL' :
                                 category === 'animation' ? 'Animation' :
                                 category === 'sound' ? 'Sound' :
                                 category === 'ui' ? 'UI' :
                                 category === 'model' ? 'Model' :
                                 category === 'cosmetic' ? 'Cosmetic' :
                                 category === 'server-side' ? 'Server-side' :
                                 category === 'client-side' ? 'Client-side' :
                                 category === 'modpack' ? 'Modpack' :
                                 category === 'framework' ? 'Framework' :
                                 category === 'map' ? 'Map' :
                                 category === 'gamemode' ? 'Gamemode' :
                                 category === 'weapon' ? 'Weapon' :
                                 category === 'legend' ? 'Legend' :
                                 'Other'}
                              </span>
                            )}
                          </div>

                          {(state === 'installed' || state === 'update') && (
                            <div className="absolute top-2 right-2">
                              <span className={`badge badge-sm ${state === 'update' ? 'badge-warning' : 'badge-success'}`}>
                                {state === 'update' ? 'Update Available' : 'Installed'}
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                              onClick={() => toggleFavoriteMod(modId)}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              ⭐
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4 flex flex-col h-full">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{title}</h4>
                            <div className="text-xs opacity-60 mb-2">v{ver}</div>
                            {m?.versions?.[0]?.description && (
                              <p className="text-xs opacity-80 line-clamp-3 mb-3">{m.versions[0].description}</p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs opacity-60 mb-3">
                              {(() => {
                                const totalDownloads = (m?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
                                if (totalDownloads > 0) {
                                  return <span>📥 {totalDownloads.toLocaleString()}</span>;
                                }
                                return null;
                              })()}
                              <span>⭐ {(m?.rating_score || 0).toFixed(1)}</span>
                            </div>
                            
                            {isFavorite && (
                              <div className="text-xs opacity-50 flex items-center gap-1 mb-2">
                                ⭐ Favorited
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-auto">
                            {state === 'not' && (
                              <button 
                                className={`btn btn-sm btn-success flex-1 ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                onClick={()=>installFromAll(m)} 
                                disabled={!isInstalled || !!installingMods[key]}
                              > 
                                {installingMods[key]==='install' ? 'Installing…' : 'Install'}
                              </button>
                            )}
                            {state === 'installed' && (
                              <button 
                                className={`btn btn-sm btn-error flex-1 ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                onClick={()=>uninstallFromAll(m)}
                              >
                                Uninstall
                              </button>
                            )}
                            {state === 'update' && (
                              <>
                                <button 
                                  className={`btn btn-sm btn-warning flex-1 ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                  onClick={()=>updateFromAll(m)} 
                                  disabled={!isInstalled}
                                >
                                  {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                                </button>
                                <button 
                                  className={`btn btn-sm btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                  onClick={()=>uninstallFromAll(m)}
                                  title="Uninstall"
                                >
                                  🗑
                                </button>
                              </>
                            )}
                            <button 
                              className="btn btn-sm btn-outline gap-1" 
                              onClick={()=>openModDetails(m)}
                              title="View details"
                            >
                              📋 Details
                            </button>
                            {m.package_url && (
                              <a
                                href={`${m.package_url}changelog/`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline gap-1"
                                title="View changelog"
                              >
                                📝 Changelog
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {installingMods[key]==='install' && (
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            {(() => { 
                              const mp = modProgress[key]; 
                              const pct = mp?.total ? Math.min(100, Math.floor((mp.received/mp.total)*100)) : (mp?.phase==='extracting' ? 100 : 0); 
                              const phaseLabel = mp?.phase==='extracting' ? 'Extracting' : 'Downloading'; 
                              return (
                                <div className="bg-base-100/90 rounded p-2">
                                  <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                                    <span>{phaseLabel}</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <progress className="progress progress-primary progress-xs w-full" value={pct} max={100}></progress>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedMods.slice(0, 60).map((m: any) => {
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
                    const tags = getModTags(m);
                    
                    return (
                      <div key={modId} className="flex gap-4 p-4 glass-soft rounded-lg border border-white/10 hover:border-primary/30 transition-all hover:shadow-md relative">
                        <div className="w-16 h-16 bg-base-300/40 rounded-lg overflow-hidden flex-shrink-0">
                          {m?.versions?.[0]?.icon ? (
                            <img src={m.versions[0].icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                              📦
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">{title}</h4>
                                {tags.length > 0 ? (
                                  tags.map((tag, idx) => (
                                    <span key={idx} className="badge badge-xs bg-black/30 text-white border-white/20">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className={`badge badge-xs ${
                                    category === 'weapon' ? 'badge-error' : 
                                    category === 'map' ? 'badge-info' : 
                                    category === 'ui' ? 'badge-warning' : 
                                    category === 'gamemode' ? 'badge-success' : 
                                    category === 'sound' ? 'badge-secondary' : 
                                    category === 'animation' ? 'badge-accent' :
                                    category === 'qol' ? 'badge-primary' :
                                    'badge-neutral'
                                  }`}>
                                    {category === 'qol' ? 'QoL' :
                                     category === 'animation' ? 'Animation' :
                                     category === 'sound' ? 'Sound' :
                                     category === 'ui' ? 'UI' :
                                     category === 'model' ? 'Model' :
                                     category === 'cosmetic' ? 'Cosmetic' :
                                     category === 'server-side' ? 'Server-side' :
                                     category === 'client-side' ? 'Client-side' :
                                     category === 'modpack' ? 'Modpack' :
                                     category === 'framework' ? 'Framework' :
                                     category === 'map' ? 'Map' :
                                     category === 'gamemode' ? 'Gamemode' :
                                     category === 'weapon' ? 'Weapon' :
                                     category === 'legend' ? 'Legend' :
                                     'Other'}
                                  </span>
                                )}
                                {(state === 'installed' || state === 'update') && (
                                  <span className={`badge badge-xs ${state === 'update' ? 'badge-warning' : 'badge-success'}`}>
                                    {state === 'update' ? 'Update' : 'Installed'}
                                  </span>
                                )}
                                {isFavorite && <span className="text-xs">⭐</span>}
                              </div>
                              <div className="text-xs opacity-60 mb-1">v{ver}</div>
                              {m?.versions?.[0]?.description && (
                                <p className="text-xs opacity-80 line-clamp-2 mb-2">{m.versions[0].description}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs opacity-60">
                                {(() => {
                                  const totalDownloads = (m?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
                                  if (totalDownloads > 0) {
                                    return <span>📥 {totalDownloads.toLocaleString()}</span>;
                                  }
                                  return null;
                                })()}
                                <span>⭐ {(m?.rating_score || 0).toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button 
                                className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                                onClick={() => toggleFavoriteMod(modId)}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                ⭐
                              </button>
                              
                              {state === 'not' && (
                                <button 
                                  className={`btn btn-sm btn-success ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                  onClick={()=>installFromAll(m)} 
                                  disabled={!isInstalled || !!installingMods[key]}
                                > 
                                  {installingMods[key]==='install' ? 'Installing…' : 'Install'}
                                </button>
                              )}
                              {state === 'installed' && (
                                <button 
                                  className={`btn btn-sm btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                  onClick={()=>uninstallFromAll(m)}
                                >
                                  Uninstall
                                </button>
                              )}
                              {state === 'update' && (
                                <>
                                  <button 
                                    className={`btn btn-sm btn-warning ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                    onClick={()=>updateFromAll(m)} 
                                    disabled={!isInstalled}
                                  >
                                    {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                                  </button>
                                  <button 
                                    className={`btn btn-sm btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                    onClick={()=>uninstallFromAll(m)}
                                    title="Uninstall"
                                  >
                                    🗑
                                  </button>
                                </>
                              )}
                              <button 
                                className="btn btn-sm btn-outline gap-1" 
                                onClick={()=>openModDetails(m)}
                                title="View details"
                              >
                                📋 Details
                              </button>
                              {m.package_url && (
                                <a
                                  href={`${m.package_url}changelog/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-sm btn-outline gap-1"
                                  title="View changelog"
                                >
                                  📝 Changelog
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {installingMods[key]==='install' && (
                          <div className="absolute bottom-2 left-20 right-2">
                            {(() => { 
                              const mp = modProgress[key]; 
                              const pct = mp?.total ? Math.min(100, Math.floor((mp.received/mp.total)*100)) : (mp?.phase==='extracting' ? 100 : 0); 
                              const phaseLabel = mp?.phase==='extracting' ? 'Extracting' : 'Downloading'; 
                              return (
                                <div className="bg-base-100/90 rounded p-2">
                                  <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                                    <span>{phaseLabel}</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <progress className="progress progress-primary progress-xs w-full" value={pct} max={100}></progress>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredAndSortedMods.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h4 className="text-lg font-semibold mb-2">No mods found</h4>
                  <p className="text-sm opacity-70 mb-4">
                    {modsQuery.trim() 
                      ? `No mods match "${modsQuery}"`
                      : `No mods available for the selected filters`
                    }
                  </p>
                  {modsQuery.trim() && (
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => setModsQuery('')}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-70">
          <div className="flex items-center gap-2">
            <span>⚡ Powered by</span>
            <a 
              className="link link-primary font-medium" 
              href="https://thunderstore.io/c/r5valkyrie" 
              target="_blank" 
              rel="noreferrer"
            >
              Thunderstore
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>Drag installed mods to change load order</span>
          </div>
        </div>
      </div>
    </div>
  );
}


