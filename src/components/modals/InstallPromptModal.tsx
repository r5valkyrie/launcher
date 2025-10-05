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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-xl p-5 w-[560px] max-w-[92vw]">
          <div className="text-sm font-semibold mb-2">Choose install location</div>
          <div className="text-xs opacity-80 mb-3">The game will be installed inside a folder named <span className="font-mono">{selectedChannel}</span> at the path you pick.</div>
          {isLauncherFolderSelected && (
            <div className="alert alert-warning text-xs mb-3">
              <span>Do not select the launchers own install folder. Pick a separate base directory; the <span className="font-mono">{selectedChannel}</span> subfolder will be created automatically.</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input className="input input-bordered input-sm w-full" value={installBaseDir} onChange={(e)=>setInstallBaseDir(e.target.value)} placeholder="Select base folder" />
            <button className="btn btn-sm" onClick={async()=>{ const picked = await onBrowse(); if (picked) setInstallBaseDir(picked); }}>Browse</button>
          </div>
          <div className="mt-3 text-xs opacity-70">Final path</div>
          <div className="mt-1 p-2 rounded bg-base-300/40 font-mono text-xs break-all">{(installBaseDir||'').replace(/\\+$/,'')}{installBaseDir ? (window.navigator.userAgent.toLowerCase().includes('win') ? `\\${selectedChannel}` : `/${selectedChannel}`) : selectedChannel}</div>

          {baseGameSize > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-base-100/50 border border-base-300/30">
              <div className="text-sm font-medium mb-1">Download Size</div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Base game:</span>
                <span className="font-mono">{(baseGameSize / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
              {optionalFilesSize > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="opacity-80">HD textures:</span>
                  <span className="font-mono text-warning">+{(optionalFilesSize / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                </div>
              )}
              <div className="border-t border-base-300/50 mt-2 pt-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total {installIncludeOptional ? '(with HD textures)' : '(base only)'}:</span>
                  <span className="font-mono">{((baseGameSize + (installIncludeOptional ? optionalFilesSize : 0)) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-base-200/50 border border-base-300/50">
            <label className="label cursor-pointer justify-start gap-3 p-0">
              <input 
                type="checkbox" 
                className="toggle-switch" 
                checked={installIncludeOptional} 
                onChange={(e) => setInstallIncludeOptional(e.target.checked)} 
              />
              <div className="flex flex-col">
                <span className="label-text font-medium">Include HD Textures</span>
                <span className="text-xs opacity-70">Download high-resolution textures for better visual quality</span>
              </div>
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={onConfirm} disabled={!installBaseDir}>Install here</button>
          </div>
        </div>
      </div>
    </div>
  );
}


