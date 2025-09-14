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
    <div className="glass rounded-xl p-6 border border-warning/30 bg-gradient-to-r from-warning/5 to-orange/5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center">
          <span className="text-white text-sm">🔄</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-warning">
            {outdatedMods.length === 1 ? 'Mod Update Available' : 'Mod Updates Available'}
          </h3>
          <p className="text-xs opacity-70">
            {outdatedMods.length === 1 
              ? '1 mod has a newer version available' 
              : `${outdatedMods.length} mods have newer versions available`
            }
          </p>
        </div>
        <button 
          className="btn btn-warning gap-2" 
          onClick={onManageClick}
        >
          🔧 Manage Updates
        </button>
      </div>

      {/* Mod List */}
      <div className="space-y-3">
        {outdatedMods.slice(0, 4).map((m, idx) => (
          <div key={String(m?.name||'')+idx} className="flex items-center gap-4 p-3 rounded-lg bg-base-200/30 border border-base-300/50">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-warning/20 to-orange/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs">📦</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{m?.name}</div>
              <div className="flex items-center gap-2 text-xs opacity-70">
                <span className="font-mono bg-base-300/50 px-2 py-1 rounded">
                  v{m?.current || '—'}
                </span>
                <span>→</span>
                <span className="font-mono bg-warning/20 text-warning px-2 py-1 rounded">
                  v{m?.latest || '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {outdatedMods.length > 4 && (
          <div className="text-center py-2">
            <div className="text-sm opacity-70">
              and {outdatedMods.length - 4} more mod{outdatedMods.length - 4 !== 1 ? 's' : ''} with updates
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
