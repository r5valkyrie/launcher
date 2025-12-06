import React from 'react';

type ServerJoinModPromptModalProps = {
  open: boolean;
  onClose: () => void;
  serverName: string;
  modCount: number;
  onJoinWithMods: () => void;
  onJoinWithoutMods: () => void;
  isProfileSaved: boolean;
  hasModProfile?: boolean; // Whether server has a modsProfile code
};

const ServerJoinModPromptModal: React.FC<ServerJoinModPromptModalProps> = ({
  open,
  onClose,
  serverName,
  modCount,
  onJoinWithMods,
  onJoinWithoutMods,
  isProfileSaved,
  hasModProfile = false,
}) => {
  if (!open) return null;
  
  // If we have a mod profile but no count, it means we haven't downloaded it yet
  const modCountUnknown = hasModProfile && modCount === 0;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg bg-base-100 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">Server Requires Mods</h3>
            <p className="text-sm text-base-content/60">
              <span className="font-semibold text-amber-400">{serverName}</span> uses a custom mod profile
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="glass rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold">
                {modCountUnknown ? 'Custom Mod Profile' : `${modCount} Required Mod${modCount !== 1 ? 's' : ''}`}
              </div>
              <div className="text-xs text-base-content/50">
                {isProfileSaved ? 'Profile saved but not active' : modCountUnknown ? 'Profile needs to be downloaded' : 'Profile not yet installed'}
              </div>
            </div>
          </div>

          <div className="alert bg-amber-500/10 border-amber-500/20">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="text-xs">
              {isProfileSaved ? (
                <>The server's mod profile will be applied to match the server's configuration.</>
              ) : (
                <>Missing mods will be downloaded and the profile will be applied. This may take a few moments.</>
              )}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-center text-base-content/80 font-medium">
            Would you like to {isProfileSaved ? 'apply' : 'install'} the server's mod profile before joining?
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            className="btn btn-primary w-full gap-2"
            onClick={onJoinWithMods}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isProfileSaved ? (
                <>
                  <polyline points="20 6 9 17 4 12"/>
                </>
              ) : (
                <>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </>
              )}
            </svg>
            Yes, {isProfileSaved ? 'Apply' : 'Install'} & Join Server
          </button>
          <button 
            className="btn btn-ghost w-full gap-2"
            onClick={onJoinWithoutMods}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Join Without Mods
          </button>
          <button 
            className="btn btn-ghost w-full"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={onClose} />
    </div>
  );
};

export default ServerJoinModPromptModal;

