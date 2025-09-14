import React from 'react';

type DownloadOptimizerProps = {
  concurrency: number;
  setConcurrency: (value: number) => void;
  partConcurrency: number;
  setPartConcurrency: (value: number) => void;
  onOptimizeForSpeed: () => void;
  onOptimizeForStability: () => void;
  onResetToDefaults: () => void;
};

export default function DownloadOptimizer(props: DownloadOptimizerProps) {
  const {
    concurrency,
    setConcurrency,
    partConcurrency,
    setPartConcurrency,
    onOptimizeForSpeed,
    onOptimizeForStability,
    onResetToDefaults,
  } = props;

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <span className="text-white text-sm">⚡</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Download Performance</h3>
          <p className="text-xs opacity-70">Optimize download speed and stability</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">File Concurrency</label>
            <div className="badge badge-primary badge-outline font-mono">{concurrency}</div>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="range range-primary"
          />
          <div className="text-xs opacity-60">Simultaneous file downloads</div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Part Concurrency</label>
            <div className="badge badge-secondary badge-outline font-mono">{partConcurrency}</div>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={partConcurrency}
            onChange={(e) => setPartConcurrency(Number(e.target.value))}
            className="range range-secondary"
          />
          <div className="text-xs opacity-60">Parts per multipart file</div>
        </div>
      </div>
      
      <div className="divider divider-horizontal opacity-30"></div>
      
      <div className="space-y-4">
        <div className="text-sm font-medium opacity-80">Quick Presets</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            className="btn btn-outline btn-success gap-2 justify-start" 
            onClick={onOptimizeForSpeed}
            title="Optimize for maximum speed (may be less stable)"
          >
            <span className="text-lg">🚀</span>
            <div className="text-left">
              <div className="font-semibold">Speed</div>
              <div className="text-xs opacity-70">Max performance</div>
            </div>
          </button>
          <button 
            className="btn btn-outline btn-warning gap-2 justify-start" 
            onClick={onOptimizeForStability}
            title="Optimize for stability (slower but more reliable)"
          >
            <span className="text-lg">🛡️</span>
            <div className="text-left">
              <div className="font-semibold">Stability</div>
              <div className="text-xs opacity-70">Reliable downloads</div>
            </div>
          </button>
          <button 
            className="btn btn-outline btn-ghost gap-2 justify-start" 
            onClick={onResetToDefaults}
            title="Reset to recommended defaults"
          >
            <span className="text-lg">↻</span>
            <div className="text-left">
              <div className="font-semibold">Reset</div>
              <div className="text-xs opacity-70">Default settings</div>
            </div>
          </button>
        </div>
      </div>
      
      <div className="alert alert-info">
        <div className="flex-1">
          <div className="text-sm font-medium mb-2">💡 Troubleshooting Tips</div>
          <ul className="text-xs space-y-1 opacity-80">
            <li>• Use "Stability" preset if downloads frequently get stuck</li>
            <li>• Lower part concurrency for unstable internet connections</li>
            <li>• Higher file concurrency works best with fast, stable connections</li>
            <li>• Try pause/resume if downloads appear frozen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
