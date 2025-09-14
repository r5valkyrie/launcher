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
        <div className="glass rounded-xl p-0 w-[640px] max-w-[92vw] overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-primary/20 to-transparent px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/40 grid place-items-center text-white">↑</div>
            <div>
              <div className="text-sm font-semibold">Launcher update required</div>
              <div className="text-xs opacity-80">You must update to continue using the launcher.</div>
            </div>
          </div>
          {!updateDownloaded && (
            <div className="px-5 py-4">
              <progress className="progress w-full" value={Math.min(100, Math.max(0, updateProgress))} max={100}></progress>
              <div className="mt-2 text-xs opacity-80 flex items-center gap-3 font-mono">
                <span>{Math.floor(updateProgress)}%</span>
                <span>•</span>
                <span>{(updateBps/1024/1024).toFixed(2)} MB/s</span>
                {updateTotal > 0 && (
                  <>
                    <span>•</span>
                    <span>{(updateTransferred/1024/1024).toFixed(1)} / {(updateTotal/1024/1024).toFixed(1)} MB</span>
                  </>
                )}
              </div>
              {updateError && <div className="alert alert-error mt-3 text-xs"><span>{updateError}</span></div>}
            </div>
          )}
          {updateDownloaded && (
            <div className="px-5 py-4 flex justify-end gap-2">
              <button className="btn btn-sm btn-primary" onClick={onRestartToUpdate}>Restart to update</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
