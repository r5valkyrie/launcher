import React from 'react';

type ProgressInfo = {
  status: string;
  received?: number;
  total?: number;
  totalParts?: number;
  parts?: Record<number, { received: number; total: number }>;
};

type DownloadProgressProps = {
  visible: boolean;
  progressItems: Record<string, ProgressInfo>;
  exitingItems: Record<string, boolean>;
};

export default function DownloadProgress(props: DownloadProgressProps) {
  const { visible, progressItems, exitingItems } = props;

  if (!visible) return null;

  const hasProgressItems = Object.entries(progressItems).length > 0;

  return (
    <div>
      <div className="glass rounded-xl p-6 mb-6 border border-info/20 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-cyan-500 flex items-center justify-center">
            <span className="text-white text-sm">📁</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Download Details</h3>
            <p className="text-xs opacity-70">Individual file progress and status</p>
          </div>
        </div>
        
        {!hasProgressItems ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <h4 className="font-semibold mb-2">Preparing Operation</h4>
            <p className="text-sm opacity-70">Setting up download process...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(progressItems).map(([p, info]) => {
        const percent = info.total ? Math.floor(((info.received || 0) / (info.total || 1)) * 100) : undefined;
        const parts = info.parts || {};
        const totalParts = info.totalParts || Object.keys(parts).length || 0;
        const exiting = !!exitingItems[p];
              return (
                <div key={p} className={`p-4 rounded-lg bg-base-200/30 border border-base-300/50 transition-all duration-300 ${exiting ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm truncate" title={p}>{p}</div>
                        <div className="text-xs opacity-70 flex items-center gap-2">
                          <span className={`badge badge-xs ${
                            info.status === 'downloading' ? 'badge-primary' :
                            info.status === 'verifying' ? 'badge-warning' :
                            info.status === 'completed' ? 'badge-success' :
                            'badge-ghost'
                          }`}>
                            {info.status}
                          </span>
                          {percent !== undefined && <span>{percent}%</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {percent !== undefined && (
                    <div className="mb-3">
                      <progress className="progress progress-primary w-full h-2" value={percent} max={100}></progress>
                    </div>
                  )}
                  
                  {totalParts > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-accent/30">
                      <div className="text-xs font-medium opacity-80">Multipart Download ({totalParts} parts)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.from({ length: totalParts }).map((_, i) => {
                          const part = parts[i];
                          const pcent = part ? Math.floor(((part.received || 0) / (part.total || 1)) * 100) : 0;
                          return (
                            <div key={`${p}-part-${i}`} className="p-2 rounded bg-base-300/30">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Part {i+1}</span>
                                <span className="text-xs opacity-70">{pcent}%</span>
                              </div>
                              <progress className="progress progress-accent progress-xs w-full" value={pcent} max={100}></progress>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
