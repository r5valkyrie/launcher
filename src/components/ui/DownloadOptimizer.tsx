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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Download Performance</h3>
          <p className="text-xs text-base-content/50">Optimize download speed and stability</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* File Concurrency */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <label className="text-sm font-medium">File Concurrency</label>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {concurrency}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="range range-primary w-full"
          />
          <div className="flex justify-between text-xs text-base-content/40">
            <span>1</span>
            <span>Simultaneous file downloads</span>
            <span>16</span>
          </div>
        </div>
        
        {/* Part Concurrency */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <label className="text-sm font-medium">Part Concurrency</label>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {partConcurrency}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={partConcurrency}
            onChange={(e) => setPartConcurrency(Number(e.target.value))}
            className="range range-primary w-full"
          />
          <div className="flex justify-between text-xs text-base-content/40">
            <span>1</span>
            <span>Parts per multipart file</span>
            <span>12</span>
          </div>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-white/5"></div>
      
      {/* Quick Presets */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-base-content/70">Quick Presets</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            className="group flex items-center gap-3 p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all" 
            onClick={onOptimizeForSpeed}
            title="Optimize for maximum speed (may be less stable)"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Speed</div>
              <div className="text-xs text-base-content/50">Max performance</div>
            </div>
          </button>
          
          <button 
            className="group flex items-center gap-3 p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all" 
            onClick={onOptimizeForStability}
            title="Optimize for stability (slower but more reliable)"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Stability</div>
              <div className="text-xs text-base-content/50">Reliable downloads</div>
            </div>
          </button>
          
          <button 
            className="group flex items-center gap-3 p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all" 
            onClick={onResetToDefaults}
            title="Reset to recommended defaults"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <polyline points="23 20 23 14 17 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Reset</div>
              <div className="text-xs text-base-content/50">Default settings</div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium mb-2 text-base-content/80">Troubleshooting Tips</div>
            <ul className="text-xs space-y-1.5 text-base-content/50 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-base-content/30 mt-0.5">•</span>
                <span>Use "Stability" preset if downloads frequently get stuck</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base-content/30 mt-0.5">•</span>
                <span>Lower part concurrency for unstable internet connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base-content/30 mt-0.5">•</span>
                <span>Higher file concurrency works best with fast, stable connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base-content/30 mt-0.5">•</span>
                <span>Try pause/resume if downloads appear frozen</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
