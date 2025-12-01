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
    .slice(0, 3); // Show max 3 active files

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

  // Determine the current phase for display
  const getCurrentPhase = () => {
    if (downloadingCount > 0) return 'Downloading';
    if (mergingCount > 0) return 'Merging';
    if (verifyingCount > 0) return 'Verifying';
    return 'Processing';
  };

  return (
    <div className="mx-6 mb-6 download-overlay-enter">
      <div className="download-panel">
        {/* Animated gradient border */}
        <div className="download-panel-glow" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              {/* Animated icon */}
              <div className="download-icon-container">
                <div className={`download-icon ${isPaused ? 'paused' : ''}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,10 12,15 17,10" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
                  </svg>
                </div>
                {!isPaused && <div className="download-icon-ring" />}
              </div>
              
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-semibold tracking-wide">{currentOperation}</h3>
                  {!isPaused && (
                    <span className={`download-phase-badge ${getCurrentPhase().toLowerCase()}`}>
                      {getCurrentPhase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs opacity-70 mt-0.5">
                  {totalCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                  className={`download-btn ${isPaused ? 'download-btn-resume' : 'download-btn-pause'}`}
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
                  className="download-btn download-btn-cancel"
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
          <div className="relative mb-5">
            <div className="download-progress-track">
              <div 
                className={`download-progress-fill ${isPaused ? 'paused' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="download-progress-shimmer"
                style={{ width: `${progressPercent}%`, opacity: isPaused ? 0 : 1 }}
              />
            </div>
            
            {/* Percentage badge */}
            <div 
              className="download-progress-badge"
              style={{ left: `max(24px, min(calc(${progressPercent}% - 24px), calc(100% - 48px)))` }}
            >
              {progressPercent.toFixed(1)}%
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Speed */}
            <div className="download-stat">
              <div className="download-stat-icon speed">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="download-stat-value" key={pulseKey}>
                  {isPaused ? 'Paused' : speedMBps > 0 ? `${speedMBps.toFixed(1)} MB/s` : '--'}
                </div>
                <div className="download-stat-label">Speed</div>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="download-stat">
              <div className="download-stat-icon time">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="download-stat-value">{isPaused ? '--' : formatEta()}</div>
                <div className="download-stat-label">Remaining</div>
              </div>
            </div>

            {/* Active Tasks */}
            <div className="download-stat">
              <div className="download-stat-icon tasks">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="download-stat-value">
                  {downloadingCount > 0 && <span className="text-cyan-400">{downloadingCount}↓</span>}
                  {downloadingCount > 0 && (verifyingCount > 0 || mergingCount > 0) && <span className="opacity-40 mx-1">·</span>}
                  {mergingCount > 0 && <span className="text-purple-400">{mergingCount}⚡</span>}
                  {mergingCount > 0 && verifyingCount > 0 && <span className="opacity-40 mx-1">·</span>}
                  {verifyingCount > 0 && <span className="text-amber-400">{verifyingCount}✓</span>}
                  {downloadingCount === 0 && verifyingCount === 0 && mergingCount === 0 && <span className="opacity-50">--</span>}
                </div>
                <div className="download-stat-label">Active</div>
              </div>
            </div>
          </div>

          {/* Active Files */}
          {activeItems.length > 0 && (
            <div className="download-active-files">
              <button 
                className="download-files-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span className="text-xs font-medium opacity-70">
                  {showDetails ? 'Hide Details' : 'Show Active Files'}
                </span>
                <svg 
                  className={`w-4 h-4 opacity-50 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {showDetails && (
                <div className="download-files-list">
                  {activeItems.map(([path, info]) => {
                    const percent = info.total ? Math.floor(((info.received || 0) / (info.total || 1)) * 100) : 0;
                    const filename = path.split(/[/\\]/).pop() || path;
                    const isMultipart = (info.totalParts || 0) > 0;
                    const parts = info.parts || {};
                    
                    // Calculate multipart progress
                    let multipartProgress = 0;
                    if (isMultipart && info.totalParts) {
                      const completedParts = Object.values(parts).filter(p => p.received >= p.total).length;
                      const partialProgress = Object.values(parts).reduce((sum, p) => {
                        return sum + (p.total > 0 ? p.received / p.total : 0);
                      }, 0);
                      multipartProgress = (partialProgress / info.totalParts) * 100;
                    }

                    // Determine status type for styling
                    const getStatusType = (status: string) => {
                      if (status === 'downloading' || status.includes('downloading') || status.includes('parts')) return 'downloading';
                      if (status.includes('merging')) return 'merging';
                      if (status === 'verifying') return 'verifying';
                      return 'downloading';
                    };
                    const statusType = getStatusType(info.status);

                    return (
                      <div key={path} className="download-file-item">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Status indicator */}
                          <div className={`download-file-status ${statusType}`}>
                            {statusType === 'downloading' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            )}
                            {statusType === 'merging' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {statusType === 'verifying' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate" title={path}>{filename}</div>
                            <div className="flex items-center gap-2 text-[10px] opacity-60 mt-0.5">
                              <span className="capitalize">{statusType}</span>
                              {isMultipart && (
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px]">
                                  {info.totalParts} parts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Mini progress bar */}
                          <div className="download-file-progress">
                            <div 
                              className={`download-file-progress-fill ${statusType}`}
                              style={{ width: `${isMultipart ? multipartProgress : percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono opacity-70 w-10 text-right">
                            {Math.floor(isMultipart ? multipartProgress : percent)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.keys(progressItems).length > 3 && (
                    <div className="text-center text-[10px] opacity-40 pt-1">
                      +{Object.keys(progressItems).length - 3} more files in queue
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paused overlay effect */}
          {isPaused && (
            <div className="download-paused-overlay">
              <div className="flex items-center gap-2 text-amber-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span className="text-sm font-medium">Download Paused</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

