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

  return (
    <div key="content-launch" className="mx-6 space-y-6 overflow-y-auto pb-6 fade-in">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Session Configuration */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
              <span className="text-white text-sm">🎮</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Session Mode</h3>
              <p className="text-xs opacity-70">Choose how to launch the game</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Game Mode</label>
              <div className="flex gap-2 w-full">
                {(['CLIENT','HOST','SERVER'] as LaunchMode[]).map((m) => (
                  <button 
                    key={m} 
                    className={`btn flex-1 ${launchMode===m ? 'btn-primary' : 'btn-outline'}`} 
                    onClick={() => setLaunchMode(m)}
                  >
                    {m === 'CLIENT'} {m === 'HOST'} {m === 'SERVER'} {m}
                  </button>
                ))}
              </div>
            </div>
            
            {launchMode === 'SERVER' && (
              <div>
                <label className="block text-sm font-medium mb-2">Server Hostname</label>
                <input 
                  className="input input-bordered w-full" 
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center">
              <span className="text-white text-sm">🖥️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Video Settings</h3>
              <p className="text-xs opacity-70">Display and rendering options</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
                <span className="font-medium">Windowed</span>
                <input 
                  type="checkbox" 
                  className="toggle toggle-secondary" 
                  checked={windowed} 
                  onChange={(e)=>setWindowed(e.target.checked)} 
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
                <span className="font-medium">Borderless</span>
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
                  className="input input-bordered w-full" 
                  value={maxFps} 
                  onChange={(e)=>setMaxFps(e.target.value)} 
                  placeholder="0 (unlimited)" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Width</label>
                <input 
                  className="input input-bordered w-full" 
                  value={resW} 
                  onChange={(e)=>setResW(e.target.value)} 
                  placeholder="1920" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Height</label>
                <input 
                  className="input input-bordered w-full" 
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/80 to-accent flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Performance</h3>
              <p className="text-xs opacity-70">CPU and threading options</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Reserved Cores</label>
                <input 
                  className="input input-bordered w-full" 
                  value={reservedCores} 
                  onChange={(e)=>setReservedCores(e.target.value)} 
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Worker Threads</label>
                <input 
                  className="input input-bordered w-full" 
                  value={workerThreads} 
                  onChange={(e)=>setWorkerThreads(e.target.value)} 
                  placeholder="Auto"
                />
              </div>
            </div>
            
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <div>
                <span className="font-medium">Disable Async Systems</span>
                <p className="text-xs opacity-70">May improve stability on some systems</p>
              </div>
              <input 
                type="checkbox" 
                className="toggle toggle-accent" 
                checked={noAsync} 
                onChange={(e)=>setNoAsync(e.target.checked)} 
              />
            </label>
          </div>
        </div>

        {/* Network Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info/80 to-info flex items-center justify-center">
              <span className="text-white text-sm">🌐</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Network</h3>
              <p className="text-xs opacity-70">Connection and security options</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium">Encrypt Packets</span>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={encryptPackets} 
                onChange={(e)=>setEncryptPackets(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium">Random Key</span>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={randomNetkey} 
                onChange={(e)=>setRandomNetkey(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium">Queued Packets</span>
              <input 
                type="checkbox" 
                className="toggle toggle-info" 
                checked={queuedPackets} 
                onChange={(e)=>setQueuedPackets(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium">No Timeout</span>
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral/80 to-neutral flex items-center justify-center">
            <span className="text-white text-sm">💻</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Console & Playlist</h3>
            <p className="text-xs opacity-70">Debug console and playlist configuration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <div>
                <span className="font-medium">Show Console</span>
                <p className="text-xs opacity-70">Display debug console window</p>
              </div>
              <input 
                type="checkbox" 
                className="toggle" 
                checked={showConsole} 
                onChange={(e)=>setShowConsole(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <div>
                <span className="font-medium">ANSI Colors</span>
                <p className="text-xs opacity-70">Enable colored console output</p>
              </div>
              <input 
                type="checkbox" 
                className="toggle" 
                checked={colorConsole} 
                onChange={(e)=>setColorConsole(e.target.checked)} 
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Playlist File</label>
            <input 
              className="input input-bordered w-full" 
              value={playlistFile} 
              onChange={(e)=>setPlaylistFile(e.target.value)} 
              placeholder="playlists_r5_patch.txt" 
            />
            <p className="text-xs opacity-60 mt-1">Custom playlist configuration file</p>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning/80 to-warning flex items-center justify-center">
            <span className="text-white text-sm">🔧</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Advanced Options</h3>
            <p className="text-xs opacity-70">Developer tools and custom parameters</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium text-sm">Developer Mode</span>
              <input 
                type="checkbox" 
                className="toggle toggle-warning toggle-sm" 
                checked={enableDeveloper} 
                onChange={(e)=>setEnableDeveloper(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium text-sm">Enable Cheats</span>
              <input 
                type="checkbox" 
                className="toggle toggle-warning toggle-sm" 
                checked={enableCheats} 
                onChange={(e)=>setEnableCheats(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium text-sm">Offline Mode</span>
              <input 
                type="checkbox" 
                className="toggle toggle-warning toggle-sm" 
                checked={offlineMode} 
                onChange={(e)=>setOfflineMode(e.target.checked)} 
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <span className="font-medium text-sm">Discord RPC</span>
              <input 
                type="checkbox" 
                className="toggle toggle-warning toggle-sm" 
                checked={discordRichPresence} 
                onChange={(e)=>setDiscordRichPresence(e.target.checked)} 
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Custom Command Line</label>
            <input 
              className="input input-bordered w-full font-mono" 
              value={customCmd} 
              onChange={(e)=>setCustomCmd(e.target.value)} 
              placeholder="-debug +foo 1 +bar 0" 
            />
            <p className="text-xs opacity-60 mt-1">Additional command line arguments</p>
          </div>
        </div>
      </div>

      {/* Generated Command Preview */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral/60 to-neutral/80 flex items-center justify-center">
            <span className="text-white text-sm">🚀</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Generated Launch Command</h3>
            <p className="text-xs opacity-70">Preview of the command that will be executed</p>
          </div>
        </div>
        <div className="bg-base-200/30 border border-white/10 rounded-lg p-4">
          <div className="text-xs font-mono text-base-content/80 break-all leading-relaxed">
            {buildLaunchParameters()}
          </div>
        </div>
      </div>
    </div>
  );
}
