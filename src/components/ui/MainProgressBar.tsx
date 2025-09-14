import React from 'react';

type MainProgressBarProps = {
  visible: boolean;
  busy: boolean;
  hasStarted: boolean;
  currentOperation: string;
  bytesTotal: number;
  bytesReceived: number;
  speedBps: number;
  etaSeconds: number;
  doneCount: number;
  totalCount: number;
  isPaused: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
};

export default function MainProgressBar(props: MainProgressBarProps) {
  const {
    visible,
    busy,
    hasStarted,
    currentOperation,
    bytesTotal,
    bytesReceived,
    speedBps,
    etaSeconds,
    doneCount,
    totalCount,
    isPaused,
    onPause,
    onResume,
    onCancel,
  } = props;

  if (!visible || !busy || !hasStarted) return null;

  const progressPercent = bytesTotal > 0 ? Math.min(100, (bytesReceived / bytesTotal) * 100) : 0;
  const speedMBps = speedBps / (1024 * 1024);
  const etaMinutes = Math.floor(etaSeconds / 60);
  const etaSecondsRemainder = etaSeconds % 60;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="mx-6 mb-6">
      <div className="glass rounded-xl p-6 border border-primary/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white text-sm">⚡</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{currentOperation}</h3>
            <p className="text-xs opacity-70">
              {totalCount > 0 && `Processing ${doneCount} of ${totalCount} files`}
              {bytesTotal > 0 && totalCount > 0 && ' • '}
              {bytesTotal > 0 && `${formatBytes(bytesReceived)} / ${formatBytes(bytesTotal)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onPause && onResume && (
              <button 
                className={`btn btn-sm ${isPaused ? 'btn-success' : 'btn-warning'} gap-2`}
                onClick={isPaused ? onResume : onPause}
                title={isPaused ? 'Resume download' : 'Pause download'}
              >
                {isPaused ? '▶️' : '⏸️'}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            {onCancel && (
              <button 
                className="btn btn-sm btn-error gap-2" 
                onClick={onCancel}
                title="Cancel operation"
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="relative">
            <progress 
              className="progress progress-primary w-full h-3" 
              value={progressPercent} 
              max={100}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary-content">
              {progressPercent.toFixed(1)}%
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-base-200/50 rounded-lg">
              <span className="text-lg">📊</span>
              <div>
                <div className="font-medium">{progressPercent.toFixed(1)}%</div>
                <div className="text-xs opacity-70">Complete</div>
              </div>
            </div>
            
            {speedMBps > 0 && (
              <div className="flex items-center gap-2 p-3 bg-base-200/50 rounded-lg">
                <span className="text-lg">🚀</span>
                <div>
                  <div className="font-medium">{speedMBps.toFixed(1)} MB/s</div>
                  <div className="text-xs opacity-70">Download Speed</div>
                </div>
              </div>
            )}
            
            {etaSeconds > 0 && (
              <div className="flex items-center gap-2 p-3 bg-base-200/50 rounded-lg">
                <span className="text-lg">⏱️</span>
                <div>
                  <div className="font-medium">
                    {etaMinutes > 0 ? `${etaMinutes}m ` : ''}{etaSecondsRemainder}s
                  </div>
                  <div className="text-xs opacity-70">Time Remaining</div>
                </div>
              </div>
            )}
            
            {isPaused && (
              <div className="flex items-center gap-2 p-3 bg-warning/20 rounded-lg">
                <span className="text-lg">⏸️</span>
                <div>
                  <div className="font-medium text-warning">Paused</div>
                  <div className="text-xs opacity-70">Operation suspended</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
