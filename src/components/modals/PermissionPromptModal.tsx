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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-xl p-5 w-[560px] max-w-[92vw]">
          <div className="text-sm font-semibold mb-2">Folder Permissions Required</div>
          <div className="text-xs opacity-80 mb-4">
            To ensure the game runs properly, we need to set the correct folder permissions.
            This requires administrator privileges and will be done automatically.
          </div>

          <div className="alert alert-info text-xs mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              <strong>What we'll do:</strong><br />
              • Create the installation folder if it doesn't exist<br />
              • Set proper read/write permissions for your user account<br />
              • Remove admin requirements for the game folder
            </span>
          </div>

          <div className="mt-3 text-xs opacity-70">Installation path</div>
          <div className="mt-1 p-2 rounded bg-base-300/40 font-mono text-xs break-all">
            {installDir}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={onCancel}
              disabled={isFixingPermissions}
            >
              Cancel
            </button>
            <button 
              className={`btn btn-sm btn-primary ${isFixingPermissions ? 'loading' : ''}`}
              onClick={onConfirm}
              disabled={isFixingPermissions}
            >
              {isFixingPermissions ? 'Setting Permissions...' : 'Continue & Fix Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


