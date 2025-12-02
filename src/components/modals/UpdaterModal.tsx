import React from 'react';

type UpdaterModalProps = {
  visible: boolean;
  updateDownloaded: boolean;
  updateProgress: number;
  updateBps: number;
  updateTotal: number;
  updateTransferred: number;
  updateError: string | null;
  onRestartToUpdate: () => void;
};

export default function UpdaterModal(props: UpdaterModalProps) {
  const {
    visible,
    updateDownloaded,
    updateProgress,
    updateBps,
    updateTotal,
    updateTransferred,
    updateError,
    onRestartToUpdate,
  } = props;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl p-0 w-[640px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-lg shadow-primary/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold">Launcher Update Required</div>
              <div className="text-sm text-base-content/60">You must update to continue using the launcher</div>
            </div>
          </div>

          {/* Progress Section */}
          {!updateDownloaded && (
            <div className="px-6 py-6">
              {/* Progress bar container */}
              <div className="relative h-3 bg-base-300/30 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, updateProgress))}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-base-300/20 px-3 py-1.5 rounded-lg border border-white/5">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="font-mono font-medium">{Math.floor(updateProgress)}%</span>
                </div>
                
                <div className="flex items-center gap-2 bg-base-300/20 px-3 py-1.5 rounded-lg border border-white/5">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span className="font-mono text-base-content/70">{(updateBps/1024/1024).toFixed(2)} MB/s</span>
                </div>
                
                {updateTotal > 0 && (
                  <div className="flex items-center gap-2 bg-base-300/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span className="font-mono text-base-content/70">
                      {(updateTransferred/1024/1024).toFixed(1)} / {(updateTotal/1024/1024).toFixed(1)} MB
                    </span>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {updateError && (
                <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <span className="text-sm text-red-300">{updateError}</span>
                </div>
              )}
            </div>
          )}

          {/* Ready to Install */}
          {updateDownloaded && (
            <div className="px-6 py-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 grid place-items-center shadow-lg shadow-emerald-500/30">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-emerald-400">Update Ready</div>
                  <div className="text-sm text-base-content/60">Restart to complete the installation</div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="btn btn-primary gap-2 px-6"
                  onClick={onRestartToUpdate}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Restart to Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
