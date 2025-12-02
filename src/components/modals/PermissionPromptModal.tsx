import React from 'react';

type PermissionPromptModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isFixingPermissions: boolean;
  installDir: string;
};

export default function PermissionPromptModal({ open, onCancel, onConfirm, isFixingPermissions, installDir }: PermissionPromptModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[560px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shadow-lg shadow-amber-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold">Folder Permissions Required</div>
              <div className="text-sm text-base-content/60">Administrator privileges needed</div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Description */}
            <p className="text-sm text-base-content/70">
              To ensure the game runs properly, we need to set the correct folder permissions.
              This requires administrator privileges and will be done automatically.
            </p>

            {/* Info Box */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-cyan-300">What we'll do:</div>
                  <ul className="space-y-1.5 text-base-content/70">
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Create the installation folder if it doesn't exist
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Set proper read/write permissions for your user account
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Remove admin requirements for the game folder
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Install Path */}
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Installation path</span>
              </div>
              <div className="font-mono text-sm break-all text-base-content/80">
                {installDir}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                className="btn btn-ghost gap-2 border border-white/10 hover:border-white/20" 
                onClick={onCancel}
                disabled={isFixingPermissions}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Cancel
              </button>
              <button 
                className="btn btn-primary gap-2 px-5"
                onClick={onConfirm}
                disabled={isFixingPermissions}
              >
                {isFixingPermissions ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Setting Permissions...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Fix Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
