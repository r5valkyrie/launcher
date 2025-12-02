import React from 'react';

type LaunchMode = 'CLIENT' | 'HOST' | 'SERVER';

type GameLaunchSectionProps = {
  // Launch mode
  launchMode: LaunchMode;
  setLaunchMode: (mode: LaunchMode) => void;
  hostname: string;
  setHostname: (hostname: string) => void;

  // Video settings
  windowed: boolean;
  setWindowed: (windowed: boolean) => void;
  borderless: boolean;
  setBorderless: (borderless: boolean) => void;
  maxFps: string;
  setMaxFps: (maxFps: string) => void;
  resW: string;
  setResW: (resW: string) => void;
  resH: string;
  setResH: (resH: string) => void;

  // Performance settings
  reservedCores: string;
  setReservedCores: (cores: string) => void;
  workerThreads: string;
  setWorkerThreads: (threads: string) => void;
  noAsync: boolean;
  setNoAsync: (noAsync: boolean) => void;

  // Network settings
  encryptPackets: boolean;
  setEncryptPackets: (encrypt: boolean) => void;
  randomNetkey: boolean;
  setRandomNetkey: (random: boolean) => void;
  queuedPackets: boolean;
  setQueuedPackets: (queued: boolean) => void;
  noTimeout: boolean;
  setNoTimeout: (noTimeout: boolean) => void;

  // Console & Playlist
  showConsole: boolean;
  setShowConsole: (show: boolean) => void;
  colorConsole: boolean;
  setColorConsole: (color: boolean) => void;
  playlistFile: string;
  setPlaylistFile: (file: string) => void;

  // Gameplay & Advanced
  enableDeveloper: boolean;
  setEnableDeveloper: (enable: boolean) => void;
  enableCheats: boolean;
  setEnableCheats: (enable: boolean) => void;
  offlineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  discordRichPresence: boolean;
  setDiscordRichPresence: (enable: boolean) => void;
  customCmd: string;
  setCustomCmd: (cmd: string) => void;

  // Helper function
  buildLaunchParameters: () => string;
};

export default function GameLaunchSection(props: GameLaunchSectionProps) {
  const {
    launchMode,
    setLaunchMode,
    hostname,
    setHostname,
    windowed,
    setWindowed,
    borderless,
    setBorderless,
    maxFps,
    setMaxFps,
    resW,
    setResW,
    resH,
    setResH,
    reservedCores,
    setReservedCores,
    workerThreads,
    setWorkerThreads,
    noAsync,
    setNoAsync,
    encryptPackets,
    setEncryptPackets,
    randomNetkey,
    setRandomNetkey,
    queuedPackets,
    setQueuedPackets,
    noTimeout,
    setNoTimeout,
    showConsole,
    setShowConsole,
    colorConsole,
    setColorConsole,
    playlistFile,
    setPlaylistFile,
    enableDeveloper,
    setEnableDeveloper,
    enableCheats,
    setEnableCheats,
    offlineMode,
    setOfflineMode,
    discordRichPresence,
    setDiscordRichPresence,
    customCmd,
    setCustomCmd,
    buildLaunchParameters,
  } = props;

  const getModeIcon = (mode: LaunchMode) => {
    switch (mode) {
      case 'CLIENT':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
      case 'HOST':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      case 'SERVER':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
        );
    }
  };

  return (
    <div key="content-launch" className="launch-panels space-y-6 overflow-y-auto pb-6 fade-in">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Session Configuration */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <circle cx="12" cy="12" r="2"/>
                <path d="M6 12h.01M18 12h.01"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Session Mode</h3>
              <p className="text-xs text-base-content/50">Choose how to launch the game</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Game Mode</label>
              <div className="flex gap-2 w-full">
                {(['CLIENT','HOST','SERVER'] as LaunchMode[]).map((m) => (
                  <button 
                    key={m} 
                    className={`btn flex-1 gap-2 ${launchMode===m ? 'btn-primary' : 'btn-ghost border border-white/10 hover:border-white/20'}`} 
                    onClick={() => setLaunchMode(m)}
                  >
                    {getModeIcon(m)}
                    {m}
                  </button>
                ))}
              </div>
            </div>
            
            {launchMode === 'SERVER' && (
              <div>
                <label className="block text-sm font-medium mb-2">Server Hostname</label>
                <input 
                  className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50" 
                  value={hostname} 
                  onChange={(e) => setHostname(e.target.value)} 
                  placeholder="Enter server name" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Video Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Video Settings</h3>
              <p className="text-xs text-base-content/50">Display and rendering options</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <span className="font-medium text-sm">Windowed</span>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle toggle-secondary" 
                  checked={windowed} 
                  onChange={(e)=>setWindowed(e.target.checked)} 
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </div>
                  <span className="font-medium text-sm">Borderless</span>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle toggle-secondary" 
                  checked={borderless} 
                  onChange={(e)=>setBorderless(e.target.checked)} 
                />
              </label>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Max FPS</label>
                <input 
                  className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50" 
                  value={maxFps} 
                  onChange={(e)=>setMaxFps(e.target.value)} 
                  placeholder="0 (unlimited)" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Width</label>
                <input 
                  className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50" 
                  value={resW} 
                  onChange={(e)=>setResW(e.target.value)} 
                  placeholder="1920" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Height</label>
                <input 
                  className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50" 
                  value={resH} 
                  onChange={(e)=>setResH(e.target.value)} 
                  placeholder="1080" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Performance</h3>
              <p className="text-xs text-base-content/50">CPU and threading options</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Reserved Cores</label>
                <input 
                  className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50" 
                  value={reservedCores} 
                  onChange={(e)=>setReservedCores(e.target.value)} 
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Worker Threads</label>
                <input 
                  className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50" 
                  value={workerThreads} 
                  onChange={(e)=>setWorkerThreads(e.target.value)} 
                  placeholder="Auto"
                />
              </div>
            </div>
            
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">Disable Async Systems</span>
                  <p className="text-xs text-base-content/40">May improve stability on some systems</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-warning" 
                checked={noAsync} 
                onChange={(e)=>setNoAsync(e.target.checked)} 
              />
            </label>
          </div>
        </div>

        {/* Network Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Network</h3>
              <p className="text-xs text-base-content/50">Connection and security options</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="font-medium text-sm">Encrypt</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={encryptPackets} 
                onChange={(e)=>setEncryptPackets(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <span className="font-medium text-sm">Random Key</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={randomNetkey} 
                onChange={(e)=>setRandomNetkey(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <span className="font-medium text-sm">Queued</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={queuedPackets} 
                onChange={(e)=>setQueuedPackets(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <span className="font-medium text-sm">No Timeout</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={noTimeout} 
                onChange={(e)=>setNoTimeout(e.target.checked)} 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Console & Playlist */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Console & Playlist</h3>
            <p className="text-xs text-base-content/50">Debug console and playlist configuration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">Show Console</span>
                  <p className="text-xs text-base-content/40">Display debug console window</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-primary" 
                checked={showConsole} 
                onChange={(e)=>setShowConsole(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="13.5" cy="6.5" r="2.5"/>
                    <circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/>
                    <circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 22c-4.97 0-9-2.24-9-5v-1c0-2.76 4.03-5 9-5s9 2.24 9 5v1c0 2.76-4.03 5-9 5z"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">ANSI Colors</span>
                  <p className="text-xs text-base-content/40">Enable colored console output</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-primary" 
                checked={colorConsole} 
                onChange={(e)=>setColorConsole(e.target.checked)} 
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Playlist File</label>
            <input 
              className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50 font-mono text-sm" 
              value={playlistFile} 
              onChange={(e)=>setPlaylistFile(e.target.value)} 
              placeholder="playlists_r5_patch.txt" 
            />
            <p className="text-xs text-base-content/40 mt-2">Custom playlist configuration file</p>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Advanced Options</h3>
            <p className="text-xs text-base-content/50">Developer tools and custom parameters</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 18l6-6-6-6"/>
                    <path d="M8 6l-6 6 6 6"/>
                  </svg>
                </div>
                <span className="font-medium text-xs">Developer</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-error toggle-sm" 
                checked={enableDeveloper} 
                onChange={(e)=>setEnableDeveloper(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                  </svg>
                </div>
                <span className="font-medium text-xs">Cheats</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-error toggle-sm" 
                checked={enableCheats} 
                onChange={(e)=>setEnableCheats(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                    <line x1="12" y1="20" x2="12.01" y2="20"/>
                  </svg>
                </div>
                <span className="font-medium text-xs">Offline</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-error toggle-sm" 
                checked={offlineMode} 
                onChange={(e)=>setOfflineMode(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <span className="font-medium text-xs">Discord</span>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-error toggle-sm" 
                checked={discordRichPresence} 
                onChange={(e)=>setDiscordRichPresence(e.target.checked)} 
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Custom Command Line</label>
            <input 
              className="input input-bordered w-full font-mono bg-base-300/30 border-white/10 focus:border-primary/50" 
              value={customCmd} 
              onChange={(e)=>setCustomCmd(e.target.value)} 
              placeholder="-debug +foo 1 +bar 0" 
            />
            <p className="text-xs text-base-content/40 mt-2">Additional command line arguments</p>
          </div>
        </div>
      </div>

      {/* Generated Command Preview */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Generated Launch Command</h3>
            <p className="text-xs text-base-content/50">Preview of the command that will be executed</p>
          </div>
        </div>
        <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
          <div className="text-xs font-mono text-base-content/70 break-all leading-relaxed">
            {buildLaunchParameters()}
          </div>
        </div>
      </div>
    </div>
  );
}
