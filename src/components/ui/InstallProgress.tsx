import React, { useEffect, useState, useRef } from 'react';

type PartInfo = { received: number; total: number };
type FileInfo = { status: string; received?: number; total?: number; totalParts?: number; parts?: Record<number, PartInfo> };

type InstallProgressProps = {
  visible: boolean;
  busy: boolean;
  hasStarted: boolean;
  isPaused: boolean;
  currentOperation: string;
  bytesTotal: number;
  bytesReceived: number;
  speedBps: number;
  etaSeconds: number;
  doneCount: number;
  totalCount: number;
  progressItems: Record<string, FileInfo>;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
};

export default function InstallProgress(props: InstallProgressProps) {
  const {
    visible,
    busy,
    hasStarted,
    isPaused,
    currentOperation,
    bytesTotal,
    bytesReceived,
    speedBps,
    etaSeconds,
    doneCount,
    totalCount,
    progressItems,
    onPause,
    onResume,
    onCancel,
  } = props;

  const [showDetails, setShowDetails] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const prevBytesRef = useRef(bytesReceived);

  // Pulse animation when bytes increase
  useEffect(() => {
    if (bytesReceived > prevBytesRef.current) {
      setPulseKey(k => k + 1);
    }
    prevBytesRef.current = bytesReceived;
  }, [bytesReceived]);

  if (!visible || !busy || !hasStarted) return null;

  const progressPercent = bytesTotal > 0 ? Math.min(100, (bytesReceived / bytesTotal) * 100) : 0;
  const speedMBps = speedBps / (1024 * 1024);
  const etaMinutes = Math.floor(etaSeconds / 60);
  const etaSecondsRemainder = Math.floor(etaSeconds % 60);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatEta = () => {
    if (etaSeconds <= 0) return '--';
    if (etaMinutes >= 60) {
      const hours = Math.floor(etaMinutes / 60);
      const mins = etaMinutes % 60;
      return `${hours}h ${mins}m`;
    }
    if (etaMinutes > 0) return `${etaMinutes}m ${etaSecondsRemainder}s`;
    return `${etaSecondsRemainder}s`;
  };

  // Get active downloads (downloading or verifying)
  const activeItems = Object.entries(progressItems)
    .filter(([_, info]) => info.status === 'downloading' || info.status === 'verifying' || info.status?.includes('downloading') || info.status?.includes('merging'))
    .slice(0, 3);

  // Count statuses
  const statusCounts = Object.values(progressItems).reduce((acc, info) => {
    const status = info.status || '';
    if (status === 'downloading' || status.includes('downloading') || status.includes('parts')) {
      acc['downloading'] = (acc['downloading'] || 0) + 1;
    } else if (status === 'verifying') {
      acc['verifying'] = (acc['verifying'] || 0) + 1;
    } else if (status.includes('merging')) {
      acc['merging'] = (acc['merging'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const downloadingCount = statusCounts['downloading'] || 0;
  const verifyingCount = statusCounts['verifying'] || 0;
  const mergingCount = statusCounts['merging'] || 0;

  const getCurrentPhase = () => {
    if (downloadingCount > 0) return 'Downloading';
    if (mergingCount > 0) return 'Merging';
    if (verifyingCount > 0) return 'Verifying';
    return 'Processing';
  };

  const getPhaseColor = () => {
    const phase = getCurrentPhase();
    if (phase === 'Downloading') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (phase === 'Merging') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (phase === 'Verifying') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="mx-6 mb-6 animate-fadeSlideIn">
      <div className="glass rounded-xl p-6 relative overflow-hidden">
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Animated icon */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30 ${isPaused ? '' : 'animate-pulse'}`}>
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,10 12,15 17,10" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
                  </svg>
                </div>
                {!isPaused && (
                  <div className="absolute inset-0 rounded-xl bg-primary/30 animate-ping" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{currentOperation}</h3>
                  {isPaused ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1.5">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                      Paused
                    </span>
                  ) : (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPhaseColor()}`}>
                      {getCurrentPhase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-base-content/60 mt-1">
                  {totalCount > 0 && (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {doneCount} / {totalCount} files
                    </span>
                  )}
                  {bytesTotal > 0 && (
                    <span>{formatBytes(bytesReceived)} / {formatBytes(bytesTotal)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {onPause && onResume && (
                <button 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isPaused 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                  onClick={isPaused ? onResume : onPause}
                  title={isPaused ? 'Resume download' : 'Pause download'}
                >
                  {isPaused ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  )}
                </button>
              )}
              {onCancel && (
                <button 
                  className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-all duration-200"
                  onClick={onCancel}
                  title="Cancel operation"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Main Progress Bar */}
          <div className="relative mb-6">
            <div className="h-3 bg-base-300/30 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out relative ${isPaused ? 'bg-amber-500/50' : 'bg-gradient-to-r from-primary to-cyan-500'}`}
                style={{ width: `${progressPercent}%` }}
              >
                {!isPaused && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
            </div>
            
            {/* Percentage badge */}
            <div 
              className="absolute -top-1 transform -translate-x-1/2 bg-base-300 border border-white/10 px-2 py-0.5 rounded-md text-xs font-mono font-medium shadow-lg transition-all duration-300"
              style={{ left: `max(24px, min(calc(${progressPercent}%), calc(100% - 24px)))` }}
            >
              {progressPercent.toFixed(1)}%
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Speed */}
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold" key={pulseKey}>
                  {isPaused ? 'Paused' : speedMBps > 0 ? `${speedMBps.toFixed(1)} MB/s` : '--'}
                </div>
                <div className="text-xs text-base-content/50">Speed</div>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">{isPaused ? '--' : formatEta()}</div>
                <div className="text-xs text-base-content/50">Remaining</div>
              </div>
            </div>

            {/* Active Tasks */}
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {downloadingCount > 0 && <span className="text-cyan-400">{downloadingCount}</span>}
                  {downloadingCount > 0 && (verifyingCount > 0 || mergingCount > 0) && <span className="text-base-content/30">·</span>}
                  {mergingCount > 0 && <span className="text-purple-400">{mergingCount}</span>}
                  {mergingCount > 0 && verifyingCount > 0 && <span className="text-base-content/30">·</span>}
                  {verifyingCount > 0 && <span className="text-amber-400">{verifyingCount}</span>}
                  {downloadingCount === 0 && verifyingCount === 0 && mergingCount === 0 && <span className="text-base-content/40">--</span>}
                </div>
                <div className="text-xs text-base-content/50">Active</div>
              </div>
            </div>
          </div>

          {/* Active Files */}
          {activeItems.length > 0 && (
            <div className="border-t border-white/5 pt-4">
              <button 
                className="w-full flex items-center justify-between py-2 text-base-content/60 hover:text-base-content transition-colors"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span className="text-xs font-medium">
                  {showDetails ? 'Hide Details' : 'Show Active Files'}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {showDetails && (
                <div className="space-y-2 mt-3">
                  {activeItems.map(([path, info]) => {
                    const percent = info.total ? Math.floor(((info.received || 0) / (info.total || 1)) * 100) : 0;
                    const filename = path.split(/[/\\]/).pop() || path;
                    const isMultipart = (info.totalParts || 0) > 0;
                    const parts = info.parts || {};
                    
                    let multipartProgress = 0;
                    if (isMultipart && info.totalParts) {
                      const partialProgress = Object.values(parts).reduce((sum, p) => {
                        return sum + (p.total > 0 ? p.received / p.total : 0);
                      }, 0);
                      multipartProgress = (partialProgress / info.totalParts) * 100;
                    }

                    const getStatusType = (status: string) => {
                      if (status === 'downloading' || status.includes('downloading') || status.includes('parts')) return 'downloading';
                      if (status.includes('merging')) return 'merging';
                      if (status === 'verifying') return 'verifying';
                      return 'downloading';
                    };
                    const statusType = getStatusType(info.status);

                    const getStatusColor = () => {
                      if (statusType === 'downloading') return 'bg-cyan-500/10 text-cyan-400';
                      if (statusType === 'merging') return 'bg-purple-500/10 text-purple-400';
                      if (statusType === 'verifying') return 'bg-amber-500/10 text-amber-400';
                      return 'bg-blue-500/10 text-blue-400';
                    };

                    const getProgressColor = () => {
                      if (statusType === 'downloading') return 'bg-cyan-500';
                      if (statusType === 'merging') return 'bg-purple-500';
                      if (statusType === 'verifying') return 'bg-amber-500';
                      return 'bg-blue-500';
                    };

                    return (
                      <div key={path} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-base-300/10 border border-white/5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor()}`}>
                            {statusType === 'downloading' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            )}
                            {statusType === 'merging' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                              </svg>
                            )}
                            {statusType === 'verifying' && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20,6 9,17 4,12"/>
                              </svg>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" title={path}>{filename}</div>
                            <div className="flex items-center gap-2 text-xs text-base-content/50 mt-0.5">
                              <span className="capitalize">{statusType}</span>
                              {isMultipart && (
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px]">
                                  {info.totalParts} parts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-24 h-1.5 bg-base-300/30 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                              style={{ width: `${isMultipart ? multipartProgress : percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-base-content/60 w-10 text-right">
                            {Math.floor(isMultipart ? multipartProgress : percent)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.keys(progressItems).length > 3 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-base-content/40">
                        +{Object.keys(progressItems).length - 3} more files in queue
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
