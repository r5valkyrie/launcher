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
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
      case 'HOST':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      case 'SERVER':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
        );
    }
  };

  const getModeDescription = (mode: LaunchMode) => {
    switch (mode) {
      case 'CLIENT':
        return 'Join an existing game server';
      case 'HOST':
        return 'Host a game with listen server';
      case 'SERVER':
        return 'Run a dedicated server instance';
    }
  };

  const ToggleCard = ({ 
    checked, 
    onChange, 
    label, 
    description, 
    icon,
    accentColor = 'blue'
  }: { 
    checked: boolean; 
    onChange: (v: boolean) => void; 
    label: string; 
    description?: string;
    icon: React.ReactNode;
    accentColor?: string;
  }) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400',
      purple: 'bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400',
      amber: 'bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400',
      cyan: 'bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400',
      rose: 'bg-rose-500/10 group-hover:bg-rose-500/20 text-rose-400',
      emerald: 'bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400',
    };
    
    const toggleColorMap: Record<string, string> = {
      blue: 'toggle-primary',
      purple: 'toggle-secondary',
      amber: 'toggle-warning',
      cyan: 'toggle-info',
      rose: 'toggle-error',
      emerald: 'toggle-success',
    };

    return (
      <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-all cursor-pointer group hover:bg-base-300/30">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${colorMap[accentColor]}`}>
            {icon}
          </div>
          <div>
            <span className="font-medium text-sm block">{label}</span>
            {description && <p className="text-xs text-base-content/40 mt-0.5">{description}</p>}
          </div>
        </div>
        <input 
          type="checkbox" 
          className={`toggle ${toggleColorMap[accentColor]}`}
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
      </label>
    );
  };

  const InputField = ({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    icon,
    suffix,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    icon?: React.ReactNode;
    suffix?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-base-content/70 flex items-center gap-2">
        {icon && <span className="text-base-content/40">{icon}</span>}
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          className="input input-bordered w-full bg-base-300/30 border-white/10 focus:border-primary/50 pr-12"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-base-content/40 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const SectionHeader = ({ 
    icon, 
    title, 
    description, 
    gradient 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
    gradient: string;
  }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-xs text-base-content/50">{description}</p>
      </div>
    </div>
  );

  return (
    <div key="content-launch" className="launch-panels space-y-6 overflow-y-auto pb-6 fade-in">
      {/* Session Mode - Launch Mode Cards */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v10M1 12h6m6 0h10"/>
            </svg>
          }
          title="Session Mode"
          description="Choose how to launch the game"
          gradient="from-blue-500 to-indigo-600"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['CLIENT', 'HOST', 'SERVER'] as LaunchMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLaunchMode(mode)}
              className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                launchMode === mode
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-white/10 bg-base-300/20 hover:border-white/20 hover:bg-base-300/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${
                launchMode === mode
                  ? 'bg-primary text-primary-content shadow-lg shadow-primary/30'
                  : 'bg-base-300/50 text-base-content/60 group-hover:bg-base-300'
              }`}>
                {getModeIcon(mode)}
              </div>
              <h5 className="font-semibold text-lg mb-1">{mode}</h5>
              <p className="text-xs text-base-content/50">{getModeDescription(mode)}</p>
              {launchMode === mode && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Server Hostname - Only for SERVER mode */}
        {launchMode === 'SERVER' && (
          <div className="mt-5 p-5 rounded-xl bg-base-300/20 border border-white/5">
            <InputField
              label="Server Hostname"
              value={hostname}
              onChange={setHostname}
              placeholder="My R5 Server"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2"/>
                  <rect x="2" y="14" width="20" height="8" rx="2"/>
                </svg>
              }
            />
          </div>
        )}
      </div>

      {/* Two Column Grid for Settings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Graphics Settings */}
        <div className="glass rounded-xl p-6">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            }
            title="Graphics"
            description="Display and rendering options"
            gradient="from-purple-500 to-pink-600"
          />

          {/* Display Mode Toggles */}
          <div className="space-y-3 mb-5">
            <ToggleCard
              checked={windowed}
              onChange={setWindowed}
              label="Windowed Mode"
              description="Run in a resizable window"
              accentColor="purple"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                </svg>
              }
            />
            <ToggleCard
              checked={borderless}
              onChange={setBorderless}
              label="Borderless"
              description="Remove window decorations"
              accentColor="purple"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              }
            />
          </div>

          {/* Resolution & FPS */}
          <div className="p-4 rounded-xl bg-base-300/20 border border-white/5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Width" value={resW} onChange={setResW} placeholder="1920" suffix="px" />
              <InputField label="Height" value={resH} onChange={setResH} placeholder="1080" suffix="px" />
              <InputField label="Max FPS" value={maxFps} onChange={setMaxFps} placeholder="0" suffix="fps" />
            </div>
            
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
              <span className="text-xs text-base-content/40 mr-2 py-1">Presets:</span>
              {[
                { w: '1920', h: '1080', label: '1080p' },
                { w: '2560', h: '1440', label: '1440p' },
                { w: '3840', h: '2160', label: '4K' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { setResW(preset.w); setResH(preset.h); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    resW === preset.w && resH === preset.h
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-base-300/30 text-base-content/60 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="glass rounded-xl p-6">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            }
            title="Performance"
            description="CPU and threading options"
            gradient="from-amber-500 to-orange-600"
          />

          {/* CPU Configuration */}
          <div className="p-4 rounded-xl bg-base-300/20 border border-white/5 space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Reserved Cores"
                value={reservedCores}
                onChange={setReservedCores}
                placeholder="Auto"
              />
              <InputField
                label="Worker Threads"
                value={workerThreads}
                onChange={setWorkerThreads}
                placeholder="Auto"
              />
            </div>
          </div>

          <ToggleCard
            checked={noAsync}
            onChange={setNoAsync}
            label="Disable Async Systems"
            description="May improve stability on some systems"
            accentColor="amber"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            }
          />
        </div>

        {/* Network Settings */}
        <div className="glass rounded-xl p-6">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            }
            title="Network"
            description="Connection and security options"
            gradient="from-cyan-500 to-teal-600"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ToggleCard
              checked={encryptPackets}
              onChange={setEncryptPackets}
              label="Encrypt Packets"
              accentColor="cyan"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }
            />
            <ToggleCard
              checked={randomNetkey}
              onChange={setRandomNetkey}
              label="Random Key"
              accentColor="cyan"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              }
            />
            <ToggleCard
              checked={queuedPackets}
              onChange={setQueuedPackets}
              label="Queued Packets"
              accentColor="cyan"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              }
            />
            <ToggleCard
              checked={noTimeout}
              onChange={setNoTimeout}
              label="No Timeout"
              accentColor="cyan"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              }
            />
          </div>
        </div>

        {/* Console & Playlist */}
        <div className="glass rounded-xl p-6">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            }
            title="Console & Playlist"
            description="Debug console and game modes"
            gradient="from-violet-500 to-purple-600"
          />

          <div className="space-y-3 mb-4">
            <ToggleCard
              checked={showConsole}
              onChange={setShowConsole}
              label="Show Console"
              description="Display debug console window"
              accentColor="purple"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              }
            />
            <ToggleCard
              checked={colorConsole}
              onChange={setColorConsole}
              label="ANSI Colors"
              description="Enable colored console output"
              accentColor="purple"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="13.5" cy="6.5" r="2.5"/>
                  <circle cx="17.5" cy="10.5" r="2.5"/>
                  <circle cx="8.5" cy="7.5" r="2.5"/>
                  <circle cx="6.5" cy="12.5" r="2.5"/>
                </svg>
              }
            />
          </div>

          <div className="p-4 rounded-xl bg-base-300/20 border border-white/5">
            <InputField
              label="Playlist File"
              value={playlistFile}
              onChange={setPlaylistFile}
              placeholder="playlists_r5_patch.txt"
            />
          </div>
        </div>
      </div>

      {/* Advanced Options - Full Width */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
          }
          title="Advanced Options"
          description="Developer tools and custom parameters"
          gradient="from-rose-500 to-red-600"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <ToggleCard
            checked={enableDeveloper}
            onChange={setEnableDeveloper}
            label="Developer"
            accentColor="rose"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 18l6-6-6-6"/>
                <path d="M8 6l-6 6 6 6"/>
              </svg>
            }
          />
          <ToggleCard
            checked={enableCheats}
            onChange={setEnableCheats}
            label="Cheats"
            accentColor="rose"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
          />
          <ToggleCard
            checked={offlineMode}
            onChange={setOfflineMode}
            label="Offline"
            accentColor="rose"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              </svg>
            }
          />
          <ToggleCard
            checked={discordRichPresence}
            onChange={setDiscordRichPresence}
            label="Discord"
            accentColor="emerald"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
          />
        </div>

        <div className="p-4 rounded-xl bg-base-300/20 border border-white/5">
          <InputField
            label="Custom Command Line"
            value={customCmd}
            onChange={setCustomCmd}
            placeholder="-debug +foo 1 +bar 0"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            }
          />
          <p className="text-xs text-base-content/40 mt-2">Additional command line arguments</p>
        </div>
      </div>

      {/* Command Preview */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          }
          title="Launch Command"
          description="Generated command line parameters"
          gradient="from-emerald-500 to-green-600"
        />
        
        <div className="p-4 rounded-xl bg-base-300/30 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-base-content/40">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              <span>Command Preview</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(buildLaunchParameters())}
              className="btn btn-ghost btn-xs gap-1.5 text-base-content/50 hover:text-base-content"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
          <code className="text-xs font-mono text-emerald-400/80 break-all leading-relaxed block">
            {buildLaunchParameters()}
          </code>
        </div>
      </div>
    </div>
  );
}
