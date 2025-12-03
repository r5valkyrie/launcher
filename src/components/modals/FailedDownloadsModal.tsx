import React from 'react';

type FailedFile = {
  path: string;
  error?: string;
};

type FailedDownloadsModalProps = {
  open: boolean;
  onClose: () => void;
  onRepair: () => void;
  failedFiles: FailedFile[];
  channelName: string;
};

export default function FailedDownloadsModal(props: FailedDownloadsModalProps) {
  const { open, onClose, onRepair, failedFiles, channelName } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[560px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shadow-lg shadow-amber-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold">Some Files Failed to Download</div>
              <div className="text-sm text-base-content/50">{failedFiles.length} file{failedFiles.length !== 1 ? 's' : ''} could not be downloaded</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-base-content/70">
              The following files failed to download after multiple attempts. This may be due to network issues or server problems.
              You can try repairing the installation to download these files again.
            </p>
            
            {/* Failed files list */}
            <div className="max-h-[200px] overflow-y-auto rounded-xl bg-base-300/20 border border-white/5">
              {failedFiles.map((file, index) => {
                const filename = file.path.split(/[/\\]/).pop() || file.path;
                return (
                  <div 
                    key={file.path} 
                    className={`px-4 py-3 flex items-center gap-3 ${index !== failedFiles.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate" title={file.path}>{filename}</div>
                      {file.error && (
                        <div className="text-xs text-red-400/70 truncate" title={file.error}>{file.error}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <svg className="w-5 h-5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              <div className="text-sm text-purple-300/80">
                Click <strong>Repair Now</strong> to attempt downloading the missing files again.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
            <button 
              className="btn btn-ghost border border-white/10 hover:border-white/20 gap-2"
              onClick={onClose}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
            <button 
              className="btn bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white border-0 gap-2"
              onClick={() => {
                onClose();
                onRepair();
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Repair Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

