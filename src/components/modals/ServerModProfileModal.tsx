import React, { useState, useEffect } from 'react';
import type { ModProfile, ModProfileEntry } from '../common/modUtils';

type ServerModProfileModalProps = {
  open: boolean;
  onClose: () => void;
  profile: ModProfile | null;
  serverName: string;
  isDownloading: boolean;
  onConfirm: (saveProfile: boolean) => void;
  isAlreadySaved?: boolean;
  isActiveProfile?: boolean;
};

const ServerModProfileModal: React.FC<ServerModProfileModalProps> = ({
  open,
  onClose,
  profile,
  serverName,
  isDownloading,
  onConfirm,
  isAlreadySaved = false,
  isActiveProfile = false,
}) => {
  const [step, setStep] = useState<'confirm' | 'downloading'>('confirm');
  const [saveToProfiles, setSaveToProfiles] = useState<boolean>(true);

  useEffect(() => {
    if (isDownloading) {
      setStep('downloading');
    }
  }, [isDownloading]);

  useEffect(() => {
    if (open) {
      setStep('confirm');
      setSaveToProfiles(!isAlreadySaved); // Don't re-save if already saved
    }
  }, [open, isAlreadySaved]);

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl bg-base-100 border border-white/10 shadow-2xl">
        {step === 'confirm' && profile && (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">Install Server Mods?</h3>
                <p className="text-sm text-base-content/60">
                  Install the mod profile used by <span className="font-semibold text-purple-400">{serverName}</span>
                </p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="glass rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{profile.name}</h4>
                    {isAlreadySaved && (
                      <div className="tooltip" data-tip="Already in My Profiles">
                        <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                          </svg>
                          Saved
                        </span>
                      </div>
                    )}
                    {isActiveProfile && (
                      <div className="tooltip" data-tip="Currently active profile">
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/30 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                  {profile.description && (
                    <p className="text-sm text-base-content/60">{profile.description}</p>
                  )}
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30 flex-shrink-0">
                  {profile.mods.length} mod{profile.mods.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Mod List Preview */}
              {profile.mods.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-base-content/50 font-medium mb-2">Required Mods:</div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                    {profile.mods.map((mod, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-base-300/20 border border-white/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{mod.name}</div>
                          {mod.version && (
                            <div className="text-xs text-base-content/50 font-mono">v{mod.version}</div>
                          )}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          mod.enabled === false ? 'bg-base-300/40 text-base-content/40' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {mod.enabled === false ? 'Disabled' : 'Enabled'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info Banner */}
            <div className="alert bg-blue-500/10 border-blue-500/20 mb-4">
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div className="text-sm">
                <div className="font-semibold text-blue-400 mb-1">What will happen:</div>
                <ul className="text-xs text-base-content/70 space-y-1 ml-4 list-disc">
                  <li>Missing mods will be downloaded and installed</li>
                  <li>Existing mods will be enabled/disabled to match the profile</li>
                  <li>Your current mod setup will be preserved</li>
                </ul>
              </div>
            </div>

            {/* Save to Profiles Option */}
            {!isAlreadySaved ? (
              <label className="flex items-center gap-3 p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer mb-6">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary"
                  checked={saveToProfiles}
                  onChange={(e) => setSaveToProfiles(e.target.checked)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Save to My Profiles</div>
                  <div className="text-xs text-base-content/50 mt-0.5">Add this profile to your mod profiles for easy reuse</div>
                </div>
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              </label>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-sm text-emerald-400">Already in My Profiles</div>
                  <div className="text-xs text-base-content/50 mt-0.5">This profile is already saved in your mod profiles</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                className="btn btn-ghost flex-1"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary flex-1 gap-2"
                onClick={() => {
                  setStep('downloading');
                  onConfirm(saveToProfiles);
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Install Mods
              </button>
            </div>
          </>
        )}

        {step === 'downloading' && (
          <>
            {/* Downloading State */}
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Installing Server Mods</h3>
              <p className="text-sm text-base-content/60 mb-6">
                Downloading and applying the mod profile...
              </p>

              {profile && (
                <div className="glass rounded-xl p-4 mb-6 inline-block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{profile.name}</div>
                      <div className="text-xs text-base-content/50">{profile.mods.length} mods</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="alert bg-blue-500/10 border-blue-500/20">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span className="text-sm">The Mod Queue will open automatically to show download progress</span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop bg-black/60" onClick={onClose} />
    </div>
  );
};

export default ServerModProfileModal;

