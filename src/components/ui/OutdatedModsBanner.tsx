import React from 'react';

type OutdatedMod = {
  name: string;
  current: string;
  latest: string;
};

type OutdatedModsBannerProps = {
  visible: boolean;
  outdatedMods: OutdatedMod[];
  onManageClick: () => void;
};

export default function OutdatedModsBanner(props: OutdatedModsBannerProps) {
  const { visible, outdatedMods, onManageClick } = props;

  if (!visible || outdatedMods.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-400">
            {outdatedMods.length === 1 ? 'Mod Update Available' : 'Mod Updates Available'}
          </h3>
          <p className="text-sm text-base-content/60">
            {outdatedMods.length === 1 
              ? '1 mod has a newer version available' 
              : `${outdatedMods.length} mods have newer versions available`
            }
          </p>
        </div>
        <button 
          className="btn btn-warning gap-2 px-5" 
          onClick={onManageClick}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          Manage Updates
        </button>
      </div>

      {/* Mod List */}
      <div className="space-y-2">
        {outdatedMods.slice(0, 4).map((m, idx) => (
          <div 
            key={String(m?.name||'')+idx} 
            className="flex items-center gap-4 p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{m?.name}</div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="font-mono bg-base-300/40 px-2 py-1 rounded text-base-content/60">
                  v{m?.current || '—'}
                </span>
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
                <span className="font-mono bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                  v{m?.latest || '—'}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
          </div>
        ))}
        
        {outdatedMods.length > 4 && (
          <div className="text-center py-3">
            <div className="inline-flex items-center gap-2 text-sm text-base-content/50 bg-base-300/20 px-4 py-2 rounded-full">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              and {outdatedMods.length - 4} more mod{outdatedMods.length - 4 !== 1 ? 's' : ''} with updates
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
