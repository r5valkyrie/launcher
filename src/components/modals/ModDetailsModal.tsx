import React from 'react';

type ModDetailsModalProps = {
  open: boolean;
  modDetailsPack: any;
  onClose: () => void;
  getPackageUrlFromPack: (pack: any) => string | null;
  installedMods: any[] | null;
  compareVersions: (a: string | null, b: string | null) => number;
  sanitizeFolderName: (name: string) => string;
  installingMods: Record<string, 'install' | 'uninstall' | undefined>;
  installSpecificVersion: (pack: any, version: any) => void;
};

export default function ModDetailsModal(props: ModDetailsModalProps) {
  const {
    open,
    modDetailsPack,
    onClose,
    getPackageUrlFromPack,
    installedMods,
    compareVersions,
    sanitizeFolderName,
    installingMods,
    installSpecificVersion,
  } = props;

  if (!open || !modDetailsPack) return null;

  const latest = (Array.isArray(modDetailsPack?.versions) && modDetailsPack.versions[0]) ? modDetailsPack.versions[0] : null;
  const modName = String(modDetailsPack?.name || modDetailsPack?.full_name || 'Mod').replace(/_/g, ' ');
  const author = modDetailsPack?.owner || (modDetailsPack?.full_name||'').split('-')[0] || 'Unknown';
  const totalDownloads = (modDetailsPack?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
  const rating = modDetailsPack?.rating_score || 0;

  return (
    <div className="fixed inset-0 z-[55]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-xl w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden border border-primary/20">
          {/* Header */}
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
            
            <div className="relative p-6 flex items-start gap-4">
              {/* Mod Icon */}
              <div className="w-20 h-20 bg-base-300/40 rounded-xl overflow-hidden flex items-center justify-center border border-base-300/50">
                {modDetailsPack?.versions?.[0]?.icon ? (
                  <img src={modDetailsPack.versions[0].icon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl opacity-50">📦</span>
                )}
              </div>
              
              {/* Mod Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1">{modName}</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm opacity-70">by {author}</span>
                  {latest?.version_number && (
                    <span className="badge badge-primary">v{latest.version_number}</span>
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {totalDownloads > 0 && (
                    <div className="flex items-center gap-1">
                      <span>📥</span>
                      <span>{totalDownloads.toLocaleString()} downloads</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>⭐</span>
                    <span>{rating.toFixed(1)} rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{(modDetailsPack?.versions || []).length} version{(modDetailsPack?.versions || []).length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                {/* Description */}
                {latest?.description && (
                  <p className="text-sm opacity-80 mt-3 line-clamp-3">{latest.description}</p>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <a 
                  className="btn btn-outline btn-sm gap-2" 
                  href={getPackageUrlFromPack(modDetailsPack) || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  🌐 Thunderstore
                </a>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-0">
            <div className="flex items-center gap-3 mb-4 mt-4">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-info/20 to-cyan/20 flex items-center justify-center">
                <span className="text-xs">📋</span>
              </div>
              <h3 className="text-lg font-semibold">Available Versions</h3>
            </div>
            
            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {(modDetailsPack?.versions || []).map((v: any, idx: number) => {
                const installed = (installedMods || []).find(im => String(im.name||'').toLowerCase() === String(modDetailsPack?.name||'').toLowerCase());
                const isCurrent = installed && installed.version && v?.version_number && compareVersions(installed.version, v.version_number) === 0;
                const folderKey = sanitizeFolderName(modDetailsPack?.full_name || modDetailsPack?.name || v?.name || 'mod');
                const isLatest = idx === 0;
                
                return (
                  <div key={v?.uuid4 || v?.full_name || v?.version_number || idx} className="flex items-center gap-4 p-4 rounded-lg bg-base-200/30 border border-base-300/50 hover:border-primary/30 transition-colors">
                    {/* Version Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`badge ${isLatest ? 'badge-primary' : 'badge-outline'} font-mono`}>
                        v{v?.version_number || '—'}
                      </span>
                      {isLatest && <span className="badge badge-success badge-xs">Latest</span>}
                      {isCurrent && <span className="badge badge-info badge-xs">Installed</span>}
                    </div>
                    
                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{v?.description || 'No description available'}</p>
                      {v?.date_created && (
                        <p className="text-xs opacity-60">Released: {new Date(v.date_created).toLocaleDateString()}</p>
                      )}
                    </div>
                    
                    {/* Download Count for this version */}
                    {v?.downloads && (
                      <div className="text-xs opacity-70 flex items-center gap-1">
                        <span>📥</span>
                        <span>{v.downloads.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <div>
                      {isCurrent ? (
                        <span className="btn btn-sm btn-success btn-outline pointer-events-none gap-2">
                          ✅ Installed
                        </span>
                      ) : (
                        <button 
                          className={`btn btn-sm gap-2 ${isLatest ? 'btn-primary' : 'btn-outline'} ${installingMods[folderKey]==='install'?'btn-disabled pointer-events-none opacity-60':''}`} 
                          onClick={()=>installSpecificVersion(modDetailsPack, v)}
                        >
                          {installingMods[folderKey]==='install' ? (
                            <>⏳ Installing...</>
                          ) : (
                            <>📥 {isLatest ? 'Install Latest' : 'Install'}</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
