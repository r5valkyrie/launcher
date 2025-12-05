import React from 'react';

type QueuedMod = { pack: any; version?: any; addedAt: number };

type ModQueueModalProps = {
  open: boolean;
  onClose: () => void;
  queue: QueuedMod[];
  isProcessing: boolean;
  onRemove: (index: number) => void;
  onClear: () => void;
  onProcess: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  installingMods: Record<string, 'install' | 'uninstall' | undefined>;
  modProgress: Record<string, { received: number; total: number; phase: string }>;
};

export default function ModQueueModal(props: ModQueueModalProps) {
  const {
    open,
    onClose,
    queue,
    isProcessing,
    onRemove,
    onClear,
    onProcess,
    onMove,
    installingMods,
    modProgress,
  } = props;

  if (!open) return null;

  const currentlyInstalling = queue.length > 0 ? queue[0] : null;
  const currentKey = currentlyInstalling?.pack?.full_name || currentlyInstalling?.pack?.name || '';
  const currentProgress = modProgress[currentKey];

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[500px] max-w-[92vw] max-h-[80vh] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">Download Queue</div>
              <div className="text-sm text-base-content/60">
                {queue.length} mod{queue.length !== 1 ? 's' : ''} in queue
              </div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={onClose}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            {queue.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-base-300/30 grid place-items-center">
                  <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <h4 className="text-base font-semibold mb-1">Queue Empty</h4>
                <p className="text-sm text-base-content/50">Add mods to the queue from the Browse tab</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((item, index) => {
                  const pack = item.pack;
                  const version = item.version || pack?.versions?.[0];
                  const isFirst = index === 0;
                  const isInstalling = isProcessing && isFirst;
                  const folderKey = pack?.full_name || pack?.name || '';
                  const progress = modProgress[folderKey];
                  
                  return (
                    <div 
                      key={`${folderKey}-${item.addedAt}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isInstalling 
                          ? 'bg-blue-500/10 border-blue-500/30' 
                          : 'bg-base-300/20 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Position / Status */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        isInstalling 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-base-300/50 text-base-content/50'
                      }`}>
                        {isInstalling ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          index + 1
                        )}
                      </div>
                      
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {version?.icon ? (
                          <img src={version.icon} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                          </svg>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{pack?.name || 'Unknown'}</div>
                        <div className="text-xs text-base-content/50">
                          {version?.version_number && <span className="font-mono">v{version.version_number}</span>}
                          {pack?.owner && <span className="ml-2">by {pack.owner}</span>}
                        </div>
                        {/* Progress bar for currently installing */}
                        {isInstalling && progress && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-base-300/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ 
                                  width: progress.total 
                                    ? `${Math.min(100, (progress.received / progress.total) * 100)}%` 
                                    : progress.phase === 'extracting' ? '100%' : '0%' 
                                }}
                              />
                            </div>
                            <div className="text-[10px] text-base-content/40 mt-1">
                              {progress.phase === 'extracting' ? 'Extracting...' : 'Downloading...'}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {!isProcessing && (
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => onMove(index, index - 1)}
                              title="Move up"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="18 15 12 9 6 15"/>
                              </svg>
                            </button>
                          )}
                          {index < queue.length - 1 && (
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => onMove(index, index + 1)}
                              title="Move down"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </button>
                          )}
                          <button
                            className="btn btn-xs btn-ghost text-error"
                            onClick={() => onRemove(index)}
                            title="Remove"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {queue.length > 0 && (
            <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-base-content/40">
                {isProcessing && <span className="loading loading-spinner loading-xs"></span>}
                {isProcessing ? 'Installing mods...' : 'Waiting to process...'}
              </div>
              <div className="flex items-center gap-3">
                {!isProcessing && (
                  <button 
                    className="btn btn-sm btn-ghost gap-2 border border-white/10 hover:border-white/20"
                    onClick={onClear}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Clear All
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-ghost gap-2 border border-white/10 hover:border-white/20"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

