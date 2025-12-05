import React, { useState } from 'react';
import { getVersionDependencies, isFrameworkDependency } from '../common/modUtils';
import type { ParsedDependency } from '../common/modUtils';

type ModDetailsModalProps = {
  open: boolean;
  modDetailsPack: any;
  onClose: () => void;
  getPackageUrlFromPack: (pack: any) => string | null;
  installedMods: any[] | null;
  compareVersions: (a: string | null, b: string | null) => number;
  sanitizeFolderName: (name: string) => string;
  installingMods: Record<string, 'install' | 'uninstall' | undefined>;
  installSpecificVersion: (pack: any, version: any) => void;
  allMods?: any[];
  getPackByName?: (name: string) => any | null;
};

export default function ModDetailsModal(props: ModDetailsModalProps) {
  const {
    open,
    modDetailsPack,
    onClose,
    getPackageUrlFromPack,
    installedMods,
    compareVersions,
    sanitizeFolderName,
    installingMods,
    installSpecificVersion,
    allMods = [],
    getPackByName,
  } = props;

  const [activeSection, setActiveSection] = useState<'versions' | 'dependencies'>('versions');

  if (!open || !modDetailsPack) return null;

  const latest = (Array.isArray(modDetailsPack?.versions) && modDetailsPack.versions[0]) ? modDetailsPack.versions[0] : null;
  const modName = String(modDetailsPack?.name || modDetailsPack?.full_name || 'Mod').replace(/_/g, ' ');
  const author = modDetailsPack?.owner || (modDetailsPack?.full_name||'').split('-')[0] || 'Unknown';
  const totalDownloads = (modDetailsPack?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
  const rating = modDetailsPack?.rating_score || 0;
  const versionCount = (modDetailsPack?.versions || []).length;

  return (
    <div className="fixed inset-0 z-[55]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="relative">
            {/* Background with mod image blur */}
            <div className="absolute inset-0 overflow-hidden">
              {modDetailsPack?.versions?.[0]?.icon && (
                <img 
                  src={modDetailsPack.versions[0].icon} 
                  alt="" 
                  className="w-full h-full object-cover opacity-20 blur-2xl scale-110" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base-100/50 to-base-100"></div>
            </div>
            
            <div className="relative p-6 flex items-start gap-5">
              {/* Mod Icon */}
              <div className="w-24 h-24 bg-base-300/40 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-lg flex-shrink-0">
                {modDetailsPack?.versions?.[0]?.icon ? (
                  <img src={modDetailsPack.versions[0].icon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                )}
              </div>
              
              {/* Mod Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1 text-white">{modName}</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-base-content/60">by <span className="text-base-content/80 font-medium">{author}</span></span>
                  {latest?.version_number && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary border border-primary/30">
                      v{latest.version_number}
                    </span>
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-5 text-sm text-base-content/70">
                  {totalDownloads > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span>{totalDownloads.toLocaleString()} downloads</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>{rating.toFixed(1)} rating</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{versionCount} version{versionCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                {/* Description */}
                {latest?.description && (
                  <p className="text-sm text-base-content/60 mt-3 line-clamp-2">{latest.description}</p>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <a 
                  className="btn btn-sm bg-base-300/50 hover:bg-base-300/80 border-white/10 gap-2" 
                  href={getPackageUrlFromPack(modDetailsPack) || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Thunderstore
                </a>
                <button 
                  className="btn btn-sm btn-ghost hover:bg-white/10 w-9 h-9 p-0" 
                  onClick={onClose}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-2">
            {/* Section Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'versions'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-base-300/30 text-base-content/60 border border-white/5 hover:border-white/10 hover:text-base-content'
                }`}
                onClick={() => setActiveSection('versions')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                Versions ({(modDetailsPack?.versions || []).length})
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'dependencies'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-base-300/30 text-base-content/60 border border-white/5 hover:border-white/10 hover:text-base-content'
                }`}
                onClick={() => setActiveSection('dependencies')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                Dependencies ({getVersionDependencies(modDetailsPack?.versions?.[0]).length})
              </button>
            </div>

            {/* Versions Section */}
            {activeSection === 'versions' && (
              <>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Available Versions</h3>
                    <p className="text-xs text-base-content/50">Select a version to install</p>
                  </div>
                </div>
            
            {/* Versions List */}
            <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
              {(modDetailsPack?.versions || []).map((v: any, idx: number) => {
                const installed = (installedMods || []).find(im => String(im.name||'').toLowerCase() === String(modDetailsPack?.name||'').toLowerCase());
                const isCurrent = installed && installed.version && v?.version_number && compareVersions(installed.version, v.version_number) === 0;
                const folderKey = sanitizeFolderName(modDetailsPack?.full_name || modDetailsPack?.name || v?.name || 'mod');
                const isLatest = idx === 0;
                const isInstalling = installingMods[folderKey] === 'install';
                
                return (
                  <div 
                    key={v?.uuid4 || v?.full_name || v?.version_number || idx} 
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isCurrent 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : isLatest 
                          ? 'bg-primary/5 border-primary/20 hover:border-primary/40' 
                          : 'bg-base-300/20 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Version Badge */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className={`px-2.5 py-1 rounded text-xs font-mono ${
                        isLatest 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-base-300/50 text-base-content/70'
                      }`}>
                        v{v?.version_number || '—'}
                      </span>
                      {isLatest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                          Latest
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400">
                          Installed
                        </span>
                      )}
                    </div>
                    
                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-base-content/80 truncate">{v?.description || 'No description available'}</p>
                      {v?.date_created && (
                        <p className="text-xs text-base-content/40 mt-0.5">
                          Released {new Date(v.date_created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    
                    {/* Download Count for this version */}
                    {v?.downloads > 0 && (
                      <div className="text-xs text-base-content/50 flex items-center gap-1.5 min-w-[80px] justify-end">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>{v.downloads.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="min-w-[130px] flex justify-end">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Installed
                        </span>
                      ) : (
                        <button 
                          className={`btn btn-sm gap-2 ${isLatest ? 'btn-primary' : 'btn-ghost border border-white/10 hover:border-white/20'} ${isInstalling ? 'btn-disabled opacity-60' : ''}`}
                          onClick={() => installSpecificVersion(modDetailsPack, v)}
                          disabled={isInstalling}
                        >
                          {isInstalling ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Installing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              {isLatest ? 'Install Latest' : 'Install'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Empty State */}
            {(modDetailsPack?.versions || []).length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <p className="text-sm text-base-content/50">No versions available</p>
              </div>
            )}
              </>
            )}

            {/* Dependencies Section */}
            {activeSection === 'dependencies' && (
              <>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Dependencies</h3>
                    <p className="text-xs text-base-content/50">Required mods for latest version</p>
                  </div>
                </div>

                {/* Dependencies List */}
                {(() => {
                  const latestVersion = modDetailsPack?.versions?.[0];
                  const deps = getVersionDependencies(latestVersion);
                  
                  if (deps.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                          <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-1">No Dependencies</h4>
                        <p className="text-sm text-base-content/50">This mod can be installed without any other mods.</p>
                      </div>
                    );
                  }

                  // Separate framework deps from regular deps
                  const frameworkDeps = deps.filter(d => isFrameworkDependency(d));
                  const regularDeps = deps.filter(d => !isFrameworkDependency(d));

                  const DependencyCard = ({ dep }: { dep: ParsedDependency }) => {
                    const resolvedPack = getPackByName ? getPackByName(`${dep.author}-${dep.name}`) : 
                      allMods.find((p: any) => {
                        const fullName = String(p?.full_name || '').toLowerCase();
                        return fullName === `${dep.author}-${dep.name}`.toLowerCase();
                      });
                    
                    const isInstalled = (installedMods || []).some((m: any) => {
                      const modName = String(m?.name || m?.id || '').toLowerCase();
                      return modName === dep.name.toLowerCase() || 
                             modName === `${dep.author}-${dep.name}`.toLowerCase();
                    });
                    const isFramework = isFrameworkDependency(dep);
                    
                    return (
                      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isInstalled 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : resolvedPack 
                            ? 'bg-base-300/20 border-white/5 hover:border-white/10' 
                            : 'bg-amber-500/5 border-amber-500/20'
                      }`}>
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {resolvedPack?.versions?.[0]?.icon ? (
                            <img src={resolvedPack.versions[0].icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                            </svg>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{resolvedPack?.name || dep.name}</span>
                            {isFramework && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400">
                                Framework
                              </span>
                            )}
                            {isInstalled && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                                Installed
                              </span>
                            )}
                            {!resolvedPack && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                                Not in Catalog
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-base-content/50 mt-0.5">
                            <span className="font-mono">v{dep.version}+</span>
                            <span className="text-base-content/30">•</span>
                            <span>by {dep.author}</span>
                          </div>
                        </div>
                        
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isInstalled 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : resolvedPack 
                              ? 'bg-base-300/50 text-base-content/40' 
                              : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isInstalled ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : resolvedPack ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-1">
                      {/* Info Banner */}
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                          </svg>
                          <p className="text-xs text-blue-400/80">
                            Dependencies will be automatically installed when you install this mod.
                          </p>
                        </div>
                      </div>

                      {/* Framework Dependencies */}
                      {frameworkDeps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                            Framework Requirements ({frameworkDeps.length})
                          </h4>
                          <div className="space-y-2">
                            {frameworkDeps.map(dep => (
                              <DependencyCard key={dep.fullString} dep={dep} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regular Dependencies */}
                      {regularDeps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                            Mod Dependencies ({regularDeps.length})
                          </h4>
                          <div className="space-y-2">
                            {regularDeps.map(dep => (
                              <DependencyCard key={dep.fullString} dep={dep} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
