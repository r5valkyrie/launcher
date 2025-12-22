import React from 'react';

type UmuNotFoundModalProps = {
  open: boolean;
  onClose: () => void;
  instructions: {
    arch?: string;
    other?: string;
  };
  url: string;
};

export default function UmuNotFoundModal({ open, onClose, instructions, url }: UmuNotFoundModalProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[600px] max-w-[95vw] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 grid place-items-center shadow-lg shadow-red-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">UMU Launcher Required</div>
              <div className="text-sm text-base-content/60">Missing dependency for Linux</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Message */}
            <p className="text-sm text-base-content/70">
              The UMU launcher is required to run the game on Linux. Please install it using one of the methods below:
            </p>

            {/* Installation Instructions */}
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-5 space-y-4">
              {instructions.arch && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7V4a2 2 0 0 1 2-2h2"/>
                      <path d="M20 7V4a2 2 0 0 0-2-2h-2"/>
                      <path d="M4 17v3a2 2 0 0 0 2 2h2"/>
                      <path d="M20 17v3a2 2 0 0 1-2 2h-2"/>
                      <rect x="10" y="10" width="4" height="4"/>
                    </svg>
                    <span>Arch Linux / AUR:</span>
                  </div>
                  <div className="bg-base-300/40 border border-white/5 rounded-lg p-3 font-mono text-sm text-primary">
                    {instructions.arch}
                  </div>
                </div>
              )}

              {instructions.other && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>Other Distributions:</span>
                  </div>
                  <div className="bg-base-300/40 border border-white/5 rounded-lg p-3 text-sm text-base-content/80">
                    {instructions.other}
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="font-medium text-cyan-300">What is UMU?</div>
                  <p className="text-base-content/70">
                    UMU (Unified Wine Game Launcher) is a compatibility layer that allows Windows games to run on Linux. 
                    It's required for running R5Valkyrie on Linux systems.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button 
                className="btn btn-ghost gap-2 flex-1 border border-white/10 hover:border-white/20" 
                onClick={() => {
                  window.electronAPI?.openExternal?.(url);
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open GitHub Releases
              </button>
              <button 
                className="btn btn-primary gap-2 flex-1" 
                onClick={onClose}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                I'll Install It Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
