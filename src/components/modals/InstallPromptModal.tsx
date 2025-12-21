import React from 'react';

type InstallPromptModalProps = {
  open: boolean;
  onClose: () => void;
  selectedChannel: string;
  launcherRoot: string;
  installBaseDir: string;
  setInstallBaseDir: (dir: string) => void;
  baseGameSize: number;
  optionalFilesSize: number;
  installIncludeOptional: boolean;
  setInstallIncludeOptional: (v: boolean) => void;
  onConfirm: () => void;
  onBrowse: () => Promise<string | null>;
};

export default function InstallPromptModal(props: InstallPromptModalProps) {
  const {
    open,
    onClose,
    selectedChannel,
    launcherRoot,
    installBaseDir,
    setInstallBaseDir,
    baseGameSize,
    optionalFilesSize,
    installIncludeOptional,
    setInstallIncludeOptional,
    onConfirm,
    onBrowse,
  } = props;

  if (!open) return null;

  const normRoot = (launcherRoot || '').replace(/\\+$/,'').toLowerCase();
  const normBase = (installBaseDir || '').replace(/\\+$/,'').toLowerCase();
  const isLauncherFolderSelected = normRoot && normBase && normBase === normRoot;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[560px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-lg shadow-primary/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold">Choose Install Location</div>
              <div className="text-sm text-base-content/60">
                Installing to <span className="font-mono text-primary">{selectedChannel}</span> folder
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Warning */}
            {isLauncherFolderSelected && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="text-sm text-amber-200">
                  Do not select the launcher's own install folder. Pick a separate base directory; the <span className="font-mono">{selectedChannel}</span> subfolder will be created automatically.
                </div>
              </div>
            )}

            {/* Path Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Install Directory</label>
              <div className="flex items-center gap-2">
                <input 
                  className="input input-bordered flex-1 bg-base-300/30 border-white/10 focus:border-primary/50 font-mono text-sm" 
                  value={installBaseDir} 
                  onChange={(e)=>setInstallBaseDir(e.target.value)} 
                  placeholder="Select base folder" 
                />
                <button 
                  className="btn btn-ghost gap-2 border border-white/10 hover:border-white/20" 
                  onClick={async()=>{ const picked = await onBrowse(); if (picked) setInstallBaseDir(picked); }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Browse
                </button>
              </div>
            </div>

            {/* Final Path Preview */}
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Final install path</span>
              </div>
              <div className="font-mono text-sm break-all text-base-content/80">
                {(() => {
                  const base = (installBaseDir||'').replace(/[\\\/ ]+$/,'');
                  if (!base) return selectedChannel;
                  const pathSep = window.navigator.userAgent.toLowerCase().includes('win') ? '\\' : '/';
                  return `${base}${pathSep}${selectedChannel}`;
                })()}
              </div>
            </div>

            {/* Download Size */}
            {baseGameSize > 0 && (
              <div className="bg-base-300/20 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Size
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base-content/60">Base game</span>
                    <span className="font-mono bg-base-300/30 px-2 py-0.5 rounded">
                      {(baseGameSize / 1024 / 1024 / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  {optionalFilesSize > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-base-content/60">HD textures</span>
                      <span className="font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                        +{(optionalFilesSize / 1024 / 1024 / 1024).toFixed(1)} GB
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total {installIncludeOptional ? '(with HD textures)' : '(base only)'}</span>
                    <span className="font-mono bg-primary/20 text-primary px-3 py-1 rounded-lg">
                      {((baseGameSize + (installIncludeOptional ? optionalFilesSize : 0)) / 1024 / 1024 / 1024).toFixed(1)} GB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* HD Textures Toggle */}
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">Include HD Textures</span>
                  <p className="text-xs text-base-content/50">High-resolution textures for better visual quality</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-primary" 
                checked={installIncludeOptional} 
                onChange={(e) => setInstallIncludeOptional(e.target.checked)} 
              />
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                className="btn btn-ghost gap-2 border border-white/10 hover:border-white/20" 
                onClick={onClose}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Cancel
              </button>
              <button 
                className="btn btn-primary gap-2 px-6" 
                onClick={onConfirm} 
                disabled={!installBaseDir}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Install Here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
