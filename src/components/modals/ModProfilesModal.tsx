import React, { useState, useRef, useEffect } from 'react';
import { calculateProfileDiff, uploadProfileToThunderstore, downloadProfileFromThunderstore } from '../common/modUtils';
import type { ModProfile, ModProfileEntry } from '../common/modUtils';

type ModProfilesModalProps = {
  open: boolean;
  onClose: () => void;
  profiles: ModProfile[];
  activeProfileId: string | null;
  installedMods: any[];
  onCreateProfile: (name: string, description?: string) => void;
  onDeleteProfile: (id: string) => void;
  onApplyProfile: (profile: ModProfile) => void;
  onImportProfile: (profile: ModProfile) => void;
  onUpdateProfile: (id: string, updates: Partial<ModProfile>) => void;
};

type Tab = 'profiles' | 'import';

export default function ModProfilesModal(props: ModProfilesModalProps) {
  const {
    open,
    onClose,
    profiles,
    activeProfileId,
    installedMods,
    onCreateProfile,
    onDeleteProfile,
    onApplyProfile,
    onImportProfile,
    onUpdateProfile,
  } = props;

  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importedPreview, setImportedPreview] = useState<ModProfile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  // Thunderstore upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [thunderstoreCode, setThunderstoreCode] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Clear debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) return null;

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      onCreateProfile(newProfileName.trim(), newProfileDesc.trim() || undefined);
      setNewProfileName('');
      setNewProfileDesc('');
    }
  };

  const handleUploadToThunderstore = async (profile: ModProfile) => {
    setUploadingId(profile.id);
    setThunderstoreCode(null);
    setExpandedProfile(profile.id); // Expand to show the code
    
    const result = await uploadProfileToThunderstore(profile);
    
    if (result.ok) {
      setThunderstoreCode(result.code);
      // Save the code to the profile
      onUpdateProfile(profile.id, { thunderstoreCode: result.code });
      await navigator.clipboard.writeText(result.code);
    } else {
      setImportError(result.error);
    }
    
    setUploadingId(null);
  };

  const handleCopyCode = async (code: string, profileId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(profileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImportCodeChange = (code: string) => {
    setImportCode(code);
    setImportError(null);
    setImportedPreview(null);
    setThunderstoreCode(null);
    
    // Clear any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    
    // Thunderstore code format (UUID like 019aecc3-74c8-bdd1-659e-5e99e98a1f2c)
    if (/^[a-zA-Z0-9_-]{6,50}$/.test(trimmedCode)) {
      debounceRef.current = window.setTimeout(async () => {
        setIsDownloading(true);
        const result = await downloadProfileFromThunderstore(trimmedCode);
        setIsDownloading(false);
        
        if (result.ok) {
          setImportedPreview(result.profile);
        } else {
          setImportError(result.error);
        }
      }, 500);
    } else {
      setImportError('Invalid code format. Enter a Thunderstore profile code.');
    }
  };

  const handleImportProfile = () => {
    if (importedPreview) {
      onImportProfile(importedPreview);
      setImportCode('');
      setImportedPreview(null);
      setActiveTab('profiles');
    }
  };

  const handleStartEdit = (profile: ModProfile) => {
    setEditingProfile(profile.id);
    setEditName(profile.name);
    setEditDesc(profile.description || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateProfile(id, {
      name: editName.trim(),
      description: editDesc.trim() || undefined,
      updatedAt: Date.now(),
    });
    setEditingProfile(null);
  };

  const ProfileCard = ({ profile }: { profile: ModProfile }) => {
    const isActive = profile.id === activeProfileId;
    const isExpanded = expandedProfile === profile.id;
    const isEditing = editingProfile === profile.id;
    const diff = calculateProfileDiff(profile, installedMods);
    const hasChanges = diff.toEnable.length > 0 || diff.toDisable.length > 0 || diff.toInstall.length > 0;

    return (
      <div className={`rounded-xl border transition-all ${
        isActive 
          ? 'bg-primary/10 border-primary/30' 
          : 'bg-base-300/20 border-white/5 hover:border-white/10'
      }`}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isActive ? 'bg-primary/20 text-primary' : 'bg-base-300/50 text-base-content/50'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full bg-base-300/30 border-white/10"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Profile name"
                    autoFocus
                  />
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full bg-base-300/30 border-white/10"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2">
                    <button className="btn btn-xs btn-primary" onClick={() => handleSaveEdit(profile.id)}>
                      Save
                    </button>
                    <button className="btn btn-xs btn-ghost" onClick={() => setEditingProfile(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{profile.name}</h4>
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  {profile.description && (
                    <p className="text-xs text-base-content/50 mt-0.5 line-clamp-1">{profile.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-base-content/40">
                    <span>{profile.mods.length} mods</span>
                    <span>•</span>
                    <span>{profile.mods.filter(m => m.enabled).length} enabled</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={() => {
                    setExpandedProfile(isExpanded ? null : profile.id);
                    setThunderstoreCode(null);
                  }}
                  title="View details"
                >
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={() => handleStartEdit(profile)}
                  title="Edit"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {/* Share button - copy if code exists, upload if not */}
                {profile.thunderstoreCode ? (
                  <button
                    className={`btn btn-xs ${copiedId === profile.id ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => handleCopyCode(profile.thunderstoreCode!, profile.id)}
                    title={`Copy share code: ${profile.thunderstoreCode}`}
                  >
                    {copiedId === profile.id ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
                ) : (
                  <button
                    className={`btn btn-xs ${uploadingId === profile.id ? 'btn-info' : thunderstoreCode && expandedProfile === profile.id ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => handleUploadToThunderstore(profile)}
                    disabled={uploadingId !== null}
                    title="Upload to Thunderstore to get share code"
                  >
                    {uploadingId === profile.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </button>
                )}
                <button
                  className="btn btn-xs btn-ghost text-error"
                  onClick={() => onDeleteProfile(profile.id)}
                  title="Delete"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Apply Button */}
          {!isEditing && !isActive && (
            <button
              className={`btn btn-sm w-full mt-3 gap-2 ${diff.toInstall.length > 0 ? 'btn-success' : hasChanges ? 'btn-primary' : 'btn-ghost border border-white/10'}`}
              onClick={() => onApplyProfile(profile)}
            >
              {diff.toInstall.length > 0 ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {diff.toInstall.length > 0 
                ? `Apply & Install ${diff.toInstall.length} mod${diff.toInstall.length > 1 ? 's' : ''}`
                : hasChanges 
                  ? `Apply (${diff.toEnable.length + diff.toDisable.length} changes)` 
                  : 'Apply Profile'}
            </button>
          )}
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/5">
            <div className="pt-3 space-y-3">
              {/* Thunderstore Code Display - show saved code or newly uploaded code */}
              {(thunderstoreCode || profile.thunderstoreCode) && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-emerald-400">
                      {thunderstoreCode ? 'Share Code (copied!)' : 'Share Code'}
                    </div>
                    {!thunderstoreCode && profile.thunderstoreCode && (
                      <button
                        className={`btn btn-xs ${copiedId === profile.id ? 'btn-success' : 'btn-ghost'}`}
                        onClick={() => handleCopyCode(profile.thunderstoreCode!, profile.id)}
                      >
                        {copiedId === profile.id ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-lg text-center py-2 bg-base-300/30 rounded-lg select-all">
                    {thunderstoreCode || profile.thunderstoreCode}
                  </div>
                  <div className="text-[10px] text-base-content/50 mt-2 text-center">
                    Share this code with others!
                  </div>
                </div>
              )}
              
              {/* Changes Preview */}
              {hasChanges && (
                <div className="p-3 rounded-lg bg-base-300/30 space-y-2">
                  <div className="text-xs font-medium text-base-content/60 mb-2">Changes to apply:</div>
                  {diff.toEnable.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-400">{diff.toEnable.length} to enable</span>
                    </div>
                  )}
                  {diff.toDisable.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-amber-400">{diff.toDisable.length} to disable</span>
                    </div>
                  )}
                  {diff.toInstall.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-blue-400">{diff.toInstall.length} to install</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Mod List */}
              <div className="text-xs text-base-content/60 mb-1">Mods in profile:</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {profile.mods.map((mod, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-base-300/20" title={mod.fullName || mod.name}>
                    <span className={`w-2 h-2 rounded-full ${mod.enabled ? 'bg-emerald-500' : 'bg-base-content/30'}`}></span>
                    <span className="flex-1 truncate">{mod.fullName || mod.name}</span>
                    {mod.version && <span className="font-mono text-base-content/40">v{mod.version}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[600px] max-w-[92vw] max-h-[85vh] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center shadow-lg shadow-purple-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">Mod Profiles</div>
              <div className="text-sm text-base-content/60">Save and share your mod configurations</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={onClose}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'profiles'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-base-300/30 text-base-content/60 border border-white/5 hover:border-white/10'
              }`}
              onClick={() => setActiveTab('profiles')}
            >
              My Profiles ({profiles.length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'import'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-base-300/30 text-base-content/60 border border-white/5 hover:border-white/10'
              }`}
              onClick={() => setActiveTab('import')}
            >
              Import Profile
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {/* Create New Profile */}
                <div className="p-4 rounded-xl bg-base-300/20 border border-white/5 space-y-3">
                  <div className="text-sm font-medium">Create from current mods</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-sm input-bordered flex-1 bg-base-300/30 border-white/10"
                      placeholder="Profile name..."
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                    />
                    <button
                      className="btn btn-sm btn-primary gap-2"
                      onClick={handleCreateProfile}
                      disabled={!newProfileName.trim()}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Save
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full bg-base-300/30 border-white/10"
                    placeholder="Description (optional)"
                    value={newProfileDesc}
                    onChange={(e) => setNewProfileDesc(e.target.value)}
                  />
                </div>

                {/* Profiles List */}
                {profiles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-base-300/30 grid place-items-center">
                      <svg className="w-7 h-7 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                    </div>
                    <h4 className="text-base font-semibold mb-1">No Profiles Yet</h4>
                    <p className="text-sm text-base-content/50">Create your first profile to save your current mod setup.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profiles.map(profile => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'import' && (
              <div className="space-y-4">
                {/* Import Code Input */}
                <div className="p-4 rounded-xl bg-base-300/20 border border-white/5 space-y-3">
                  <div className="text-sm font-medium">Paste a profile share code</div>
                  <div className="relative">
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-300/30 border-white/10 font-mono text-xs h-24 resize-none"
                      placeholder="Paste Thunderstore code (e.g. 019aecc3-74c8-bdd1-659e-...)"
                      value={importCode}
                      onChange={(e) => handleImportCodeChange(e.target.value)}
                      disabled={isDownloading}
                    />
                    {isDownloading && (
                      <div className="absolute inset-0 bg-base-300/50 rounded-lg flex items-center justify-center">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                      </div>
                    )}
                  </div>
                  {importError && (
                    <div className="flex items-center gap-2 text-xs text-error">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {importError}
                    </div>
                  )}
                </div>

                {/* Preview */}
                {importedPreview && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Valid profile detected!
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-base-content/60">Name:</span>
                        <span className="font-medium">{importedPreview.name}</span>
                      </div>
                      {importedPreview.description && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-base-content/60">Description:</span>
                          <span className="text-base-content/80">{importedPreview.description}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-base-content/60">Mods:</span>
                        <span>{importedPreview.mods.length} ({importedPreview.mods.filter(m => m.enabled).length} enabled)</span>
                      </div>
                    </div>
                    
                    {/* Mod List Preview */}
                    <div className="max-h-32 overflow-y-auto space-y-1 pt-2 border-t border-emerald-500/20">
                      {importedPreview.mods.map((mod, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-base-300/20" title={mod.fullName || mod.name}>
                          <span className={`w-2 h-2 rounded-full ${mod.enabled ? 'bg-emerald-500' : 'bg-base-content/30'}`}></span>
                          <span className="flex-1 truncate">{mod.fullName || mod.name}</span>
                          {mod.version && <span className="font-mono text-base-content/40">v{mod.version}</span>}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      className="btn btn-sm btn-success w-full gap-2"
                      onClick={handleImportProfile}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Import Profile
                    </button>
                  </div>
                )}

                {/* How it works */}
                <div className="p-4 rounded-xl bg-base-300/20 border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <div className="text-xs text-base-content/60">
                      <p className="mb-2"><strong className="text-base-content/80">Share codes</strong></p>
                      <p className="mb-1">Upload a profile to Thunderstore to get a short code you can share.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

