import React from 'react';
import { isFrameworkDependency } from '../common/modUtils';
import type { DependencyTree, ResolvedDependency, ParsedDependency } from '../common/modUtils';

type DependencyModalProps = {
  open: boolean;
  dependencyTree: DependencyTree | null;
  onConfirm: () => void;
  onCancel: () => void;
  isInstalling?: boolean;
};

export default function DependencyModal(props: DependencyModalProps) {
  const { open, dependencyTree, onConfirm, onCancel, isInstalling = false } = props;

  if (!open) return null;

  // Handle null dependency tree (show loading or empty state)
  if (!dependencyTree) {
    return (
      <div className="fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
        <div className="absolute inset-0 grid place-items-center p-4">
          <div className="glass rounded-2xl w-[560px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10">
            <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold">Checking Dependencies</div>
                <div className="text-sm text-base-content/60">Please wait...</div>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { mod, version, toInstall, toUpdate, alreadyInstalled, missingDependencies } = dependencyTree;
  const modName = String(mod?.name || mod?.full_name || 'Mod').replace(/_/g, ' ');
  const hasActions = toInstall.length > 0 || toUpdate.length > 0;
  const hasMissing = missingDependencies.length > 0;

  const DependencyItem = ({ 
    dep, 
    status 
  }: { 
    dep: ResolvedDependency | ParsedDependency; 
    status: 'install' | 'update' | 'installed' | 'missing';
  }) => {
    const isResolved = 'pack' in dep;
    const resolvedDep = isResolved ? dep as ResolvedDependency : null;
    const isFramework = isFrameworkDependency(dep as ParsedDependency);
    
    const statusConfig = {
      install: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        label: 'Will Install',
      },
      update: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        label: 'Will Update',
      },
      installed: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        label: 'Installed',
      },
      missing: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        label: 'Not Available',
      },
    };

    const config = statusConfig[status];

    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl ${config.bg} border ${config.border}`}>
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {resolvedDep?.pack?.versions?.[0]?.icon ? (
            <img src={resolvedDep.pack.versions[0].icon} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {resolvedDep?.pack?.name || dep.name}
            </span>
            {isFramework && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400 flex-shrink-0">
                Framework
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-base-content/50 mt-0.5">
            <span className="font-mono">v{dep.version}</span>
            {resolvedDep?.isInstalled && resolvedDep?.installedVersion && (
              <>
                <span className="text-base-content/30">→</span>
                <span className="font-mono">v{resolvedDep.installedVersion}</span>
              </>
            )}
            {dep.author && (
              <>
                <span className="text-base-content/30">•</span>
                <span>by {dep.author}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`px-2 py-1 rounded text-[10px] font-medium ${config.bg} ${config.text} flex-shrink-0`}>
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!isInstalling ? onCancel : undefined} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[560px] max-w-[92vw] max-h-[85vh] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center shadow-lg shadow-emerald-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold">Install Dependencies</div>
              <div className="text-sm text-base-content/60">
                <span className="font-semibold text-base-content/80">{modName}</span>
                {version?.version_number && (
                  <span className="font-mono ml-2">v{version.version_number}</span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto space-y-5">
            {/* Summary */}
            {(hasActions || hasMissing) && (
              <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  {toInstall.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span><span className="font-semibold text-emerald-400">{toInstall.length}</span> to install</span>
                    </div>
                  )}
                  {toUpdate.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span><span className="font-semibold text-amber-400">{toUpdate.length}</span> to update</span>
                    </div>
                  )}
                  {alreadyInstalled.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span><span className="font-semibold text-blue-400">{alreadyInstalled.length}</span> satisfied</span>
                    </div>
                  )}
                  {hasMissing && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span><span className="font-semibold text-red-400">{missingDependencies.length}</span> unavailable</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* To Install Section */}
            {toInstall.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-base-content/70 mb-3">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Will Be Installed
                </div>
                <div className="space-y-2">
                  {toInstall.map(dep => (
                    <DependencyItem key={dep.fullString} dep={dep} status="install" />
                  ))}
                </div>
              </div>
            )}

            {/* To Update Section */}
            {toUpdate.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-base-content/70 mb-3">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Will Be Updated
                </div>
                <div className="space-y-2">
                  {toUpdate.map(dep => (
                    <DependencyItem key={dep.fullString} dep={dep} status="update" />
                  ))}
                </div>
              </div>
            )}

            {/* Already Installed Section */}
            {alreadyInstalled.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-base-content/70 mb-3">
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Already Satisfied
                </div>
                <div className="space-y-2">
                  {alreadyInstalled.map(dep => (
                    <DependencyItem key={dep.fullString} dep={dep} status="installed" />
                  ))}
                </div>
              </div>
            )}

            {/* Missing Section */}
            {hasMissing && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-base-content/70 mb-3">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Not Available
                </div>
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="text-sm text-red-200">
                    These dependencies are not available in the mod repository. The mod may not work correctly.
                  </div>
                </div>
                <div className="space-y-2">
                  {missingDependencies.map(dep => (
                    <DependencyItem 
                      key={dep.fullString} 
                      dep={{ ...dep, pack: null, isInstalled: false, installedVersion: null, needsUpdate: false, latestVersion: null }} 
                      status="missing" 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Dependencies */}
            {!hasActions && !hasMissing && alreadyInstalled.length === 0 && (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-500/10 grid place-items-center">
                  <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h4 className="text-base font-semibold mb-1">No Dependencies</h4>
                <p className="text-sm text-base-content/50">This mod can be installed directly.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-4 border-t border-white/5">
            <div className="text-xs text-base-content/40">
              {hasActions ? 'Dependencies will be installed automatically' : 'Ready to install'}
            </div>
            <div className="flex items-center gap-3">
              {!isInstalling && (
                <button 
                  className="btn btn-ghost gap-2 border border-white/10 hover:border-white/20"
                  onClick={onCancel}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Cancel
                </button>
              )}
              <button 
                className="btn btn-primary gap-2 px-6"
                onClick={onConfirm}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                {isInstalling ? 'Installing...' : hasActions ? `Install All (${toInstall.length + toUpdate.length + 1})` : 'Install'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
