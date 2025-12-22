import React from 'react';

type Channel = { name: string; game_url: string; isCustom?: boolean; installDir?: string };

type SettingsPanelProps = {
  busy: boolean;
  channel: Channel | undefined;
  enabledChannels: Channel[];
  channelsSettings: Record<string, any>;
  concurrency: number;
  setConcurrency: (n: number) => void;
  partConcurrency: number;
  setPartConcurrency: (n: number) => void;
  downloadSpeedLimit: number;
  setDownloadSpeedLimit: (n: number) => void;
  installDir: string;
  setInstallDir: (dir: string) => void;
  bannerVideoEnabled: boolean;
  setBannerVideoEnabled: (v: boolean) => void;
  modsShowDeprecated: boolean;
  setModsShowDeprecated: (v: boolean) => void;
  modsShowNsfw: boolean;
  setModsShowNsfw: (v: boolean) => void;
  easterEggDiscovered: boolean;
  emojiMode: boolean;
  toggleEmojiMode: (enabled: boolean) => void;
  snowEffectEnabled: boolean;
  setSnowEffectEnabled: (enabled: boolean) => void;
  newYearEffectEnabled: boolean;
  setNewYearEffectEnabled: (enabled: boolean) => void;
  repairChannel: (name: string) => void;
  onUninstallClick: (name: string) => void;
  setSetting: (key: string, value: any) => Promise<any> | void;
  openExternal: (url: string) => void;
  openFolder: (folderPath: string) => void;
  optimizeForSpeed: () => void;
  optimizeForStability: () => void;
  resetDownloadDefaults: () => void;
  installHdTextures: (channelName: string) => void;
  uninstallHdTextures: (channelName: string) => void;
};

export default function SettingsPanel(props: SettingsPanelProps) {
  const {
    busy,
    enabledChannels,
    channelsSettings,
    concurrency,
    setConcurrency,
    partConcurrency,
    setPartConcurrency,
    downloadSpeedLimit,
    setDownloadSpeedLimit,
    installDir,
    setInstallDir,
    bannerVideoEnabled,
    setBannerVideoEnabled,
    modsShowDeprecated,
    setModsShowDeprecated,
    modsShowNsfw,
    setModsShowNsfw,
    easterEggDiscovered,
    emojiMode,
    toggleEmojiMode,
    snowEffectEnabled,
    setSnowEffectEnabled,
    newYearEffectEnabled,
    setNewYearEffectEnabled,
    repairChannel,
    onUninstallClick,
    setSetting,
    openFolder,
    optimizeForSpeed,
    optimizeForStability,
    resetDownloadDefaults,
    installHdTextures,
    uninstallHdTextures,
  } = props;

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
      red: 'bg-red-500/10 group-hover:bg-red-500/20 text-red-400',
      indigo: 'bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400',
    };
    
    const toggleColorMap: Record<string, string> = {
      blue: 'toggle-primary',
      purple: 'toggle-secondary',
      amber: 'toggle-warning',
      cyan: 'toggle-info',
      rose: 'toggle-error',
      emerald: 'toggle-success',
      red: 'toggle-error',
      indigo: 'toggle-primary',
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

  const PresetCard = ({
    onClick,
    icon,
    title,
    description,
    accentColor,
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    accentColor: string;
  }) => {
    const colorMap: Record<string, string> = {
      emerald: 'hover:border-emerald-500/30 hover:bg-emerald-500/10',
      blue: 'hover:border-blue-500/30 hover:bg-blue-500/10',
      amber: 'hover:border-amber-500/30 hover:bg-amber-500/10',
    };
    
    const iconColorMap: Record<string, string> = {
      emerald: 'bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400',
      blue: 'bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400',
      amber: 'bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400',
    };

    return (
      <button 
        className={`group flex items-center gap-3 p-4 rounded-xl bg-base-300/20 border border-white/5 transition-all text-left ${colorMap[accentColor]}`}
        onClick={onClick}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${iconColorMap[accentColor]}`}>
          {icon}
        </div>
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-base-content/50">{description}</div>
        </div>
      </button>
    );
  };

  return (
    <div key="content-settings" className="space-y-6 fade-in pb-6">
      {/* Download Performance */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          }
          title="Download Performance"
          description="Optimize download speed and stability"
          gradient="from-indigo-500 to-violet-600"
        />
        
        {/* Sliders */}
        <div className="space-y-6 mb-6">
          {/* File Concurrency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <label className="text-sm font-medium">File Concurrency</label>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {concurrency}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={concurrency}
              onChange={(e) => {
                const value = Number(e.target.value);
                setConcurrency(value);
                setSetting('concurrency', value);
              }}
              className="range range-primary w-full"
            />
            <div className="flex justify-between text-xs text-base-content/40">
              <span>1</span>
              <span>Simultaneous file downloads</span>
              <span>16</span>
            </div>
          </div>
          
          {/* Part Concurrency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <label className="text-sm font-medium">Part Concurrency</label>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {partConcurrency}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={partConcurrency}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPartConcurrency(value);
                setSetting('partConcurrency', value);
              }}
              className="range range-primary w-full"
            />
            <div className="flex justify-between text-xs text-base-content/40">
              <span>1</span>
              <span>Parts per multipart file</span>
              <span>12</span>
            </div>
          </div>
        </div>
        
        {/* Quick Presets */}
        <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-4">Quick Presets</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PresetCard
            onClick={optimizeForSpeed}
            title="Speed"
            description="Max performance"
            accentColor="emerald"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            }
          />
          <PresetCard
            onClick={optimizeForStability}
            title="Stability"
            description="Reliable downloads"
            accentColor="blue"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
          />
          <PresetCard
            onClick={resetDownloadDefaults}
            title="Reset"
            description="Default settings"
            accentColor="amber"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <polyline points="23 20 23 14 17 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* Download Speed Limit */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          }
          title="Download Speed Limit"
          description="Cap maximum download speed across all downloads"
          gradient="from-amber-500 to-orange-600"
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Maximum Speed: <span className="text-amber-400">{downloadSpeedLimit === 0 ? 'Unlimited' : `${(downloadSpeedLimit / 1024 / 1024).toFixed(1)} MB/s`}</span>
            </label>
            <input
              type="range"
              min="0"
              max="104857600"
              step="1048576"
              value={downloadSpeedLimit}
              onChange={async (e) => {
                const value = Number(e.target.value);
                setDownloadSpeedLimit(value);
                await setSetting('downloadSpeedLimit', value);
                if (window.electronAPI?.setDownloadSpeedLimit) {
                  await window.electronAPI.setDownloadSpeedLimit(value);
                }
              }}
              className="range range-warning w-full"
            />
            <div className="flex justify-between text-xs text-base-content/40 mt-1">
              <span>Unlimited</span>
              <span>25 MB/s</span>
              <span>50 MB/s</span>
              <span>75 MB/s</span>
              <span>100 MB/s</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 0, label: '∞' },
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ].map((preset) => (
              <button
                key={preset.value}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  downloadSpeedLimit === preset.value * 1024 * 1024
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-base-300/30 text-base-content/60 border border-white/5 hover:border-white/10'
                }`}
                onClick={async () => {
                  const value = preset.value * 1024 * 1024;
                  setDownloadSpeedLimit(value);
                  await setSetting('downloadSpeedLimit', value);
                  if (window.electronAPI?.setDownloadSpeedLimit) {
                    await window.electronAPI.setDownloadSpeedLimit(value);
                  }
                }}
              >
                {preset.label} {preset.value !== 0 && 'MB/s'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Base Directory */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          }
          title="Default Install Location"
          description="Set a custom base directory for game installations"
          gradient="from-cyan-500 to-blue-600"
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">Base Directory</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1 font-mono text-sm bg-base-300/30 border-white/10 focus:border-primary/50 overflow-x-auto"
                value={installDir}
                onChange={(e) => setInstallDir(e.target.value)}
                onBlur={async (e) => {
                  await setSetting('installDir', e.target.value);
                }}
                placeholder={typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('linux') 
                  ? '~/Games/R5VLibrary (default)' 
                  : '%LOCALAPPDATA%\\Programs\\R5VLibrary (default)'}
              />
              <button
                className="btn btn-ghost border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 gap-2"
                onClick={async () => {
                  const dir = await window.electronAPI?.selectDirectory?.();
                  console.log('Selected directory:', dir);
                  if (dir) {
                    setInstallDir(dir);
                    console.log('Setting install dir to:', dir);
                    const result = await setSetting('installDir', dir);
                    console.log('setSetting result:', result);
                    if (confirm('Custom base directory set! Reload launcher to detect channels in the new location?')) {
                      console.log('Reloading...');
                      setTimeout(() => window.location.reload(), 100);
                    }
                  }
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Browse
              </button>
              {installDir && (
                <button
                  className="btn btn-ghost border border-white/10 hover:border-red-500/30 hover:bg-red-500/10"
                  onClick={async () => {
                    if (confirm('Reset to default install location? Launcher will reload.')) {
                      setInstallDir('');
                      await setSetting('installDir', '');
                      // Also clear channel-specific installDirs
                      const currentSettings = await window.electronAPI?.getSettings?.();
                      if (currentSettings?.channels) {
                        const updatedChannels = { ...currentSettings.channels };
                        Object.keys(updatedChannels).forEach(ch => {
                          if (updatedChannels[ch]) {
                            updatedChannels[ch].installDir = undefined;
                          }
                        });
                        await setSetting('channels', updatedChannels);
                      }
                      setTimeout(() => window.location.reload(), 100);
                    }
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-base-300/20 border border-white/5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1 text-base-content/80">About Custom Directory</div>
                <p className="text-xs text-base-content/50 leading-relaxed">
                  Set a custom location where game channels will be installed. Each channel will create a subfolder (e.g., LIVE, BETA). 
                  Custom builds in this location will be automatically detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <div className="glass rounded-xl p-6">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            }
            title="Appearance"
            description="Customize the visual experience"
            gradient="from-purple-500 to-pink-600"
          />
          
          <div className="space-y-3">
            <ToggleCard
              checked={bannerVideoEnabled}
              onChange={async (v) => {
                setBannerVideoEnabled(v);
                await setSetting('bannerVideoEnabled', v);
              }}
              label="Banner Video"
              description="Enable animated background videos"
              accentColor="purple"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              }
            />

            {/* Holiday Theme - Only show in December */}
            {new Date().getMonth() === 11 && (
              <ToggleCard
                checked={snowEffectEnabled}
                onChange={async (v) => {
                  setSnowEffectEnabled(v);
                  await setSetting('snowEffectEnabled', v);
                  // Disable New Year effect when enabling Christmas
                  if (v && newYearEffectEnabled) {
                    setNewYearEffectEnabled(false);
                    await setSetting('newYearEffectEnabled', false);
                  }
                }}
                label="Holiday Theme"
                description="Festive snow, lights & decorations"
                accentColor="red"
                icon={<span className="text-base">🎄</span>}
              />
            )}

            {/* New Year Theme - Only show Jan 1-3 */}
            {new Date().getMonth() === 0 && new Date().getDate() <= 3 && (
              <ToggleCard
                checked={newYearEffectEnabled}
                onChange={async (v) => {
                  setNewYearEffectEnabled(v);
                  await setSetting('newYearEffectEnabled', v);
                  // Disable Christmas effect when enabling New Year
                  if (v && snowEffectEnabled) {
                    setSnowEffectEnabled(false);
                    await setSetting('snowEffectEnabled', false);
                  }
                }}
                label="New Year Theme"
                description="Fireworks, confetti & celebrations"
                accentColor="yellow"
                icon={<span className="text-base">🎉</span>}
              />
            )}

            {easterEggDiscovered && (
              <ToggleCard
                checked={emojiMode}
                onChange={toggleEmojiMode}
                label="Emoji Letters"
                description="Transform text into blue square emojis"
                accentColor="purple"
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <path d="M9 9h.01M15 9h.01M9 15h6"/>
                  </svg>
                }
              />
            )}
          </div>
        </div>

        {/* Mod Settings */}
        <div className="glass rounded-xl p-6">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            }
            title="Mod Preferences"
            description="Control mod visibility and filtering"
            gradient="from-emerald-500 to-teal-600"
          />
          
          <div className="space-y-3">
            <ToggleCard
              checked={modsShowDeprecated}
              onChange={async (v) => {
                setModsShowDeprecated(v);
                await setSetting('modsShowDeprecated', v);
              }}
              label="Deprecated Mods"
              description="Show outdated or unsupported mods"
              accentColor="emerald"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
            />
            
            <ToggleCard
              checked={modsShowNsfw}
              onChange={async (v) => {
                setModsShowNsfw(v);
                await setSetting('modsShowNsfw', v);
              }}
              label="NSFW Content"
              description="Show adult-oriented modifications"
              accentColor="emerald"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Channel Management - Improved Balance */}
      <div className="glass rounded-xl p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          }
          title="Release Channels"
          description="Manage installed game versions"
          gradient="from-blue-500 to-indigo-600"
        />

        <div className="space-y-4">
          {enabledChannels.map((c) => {
            const ch = channelsSettings?.[c.name];
            // For custom channels, use the stored installDir; for official channels, compute from base + channel name
            const storedDir = c.isCustom ? c.installDir : ch?.installDir;
            // If no stored dir for official channel, compute it from base installDir
            const dir = storedDir || (!c.isCustom && installDir ? `${installDir}/${c.name}` : undefined);
            const ver = ch?.gameVersion;
            // Consider installed if there's a stored version OR a custom installDir
            const isInstalled = !!ver || !!storedDir;
            const hdTexturesInstalled = !!ch?.hdTexturesInstalled || !!ch?.includeOptional;
            const isCustom = !!c.isCustom;
            
            return (
              <div key={c.name} className="p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-all">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                    isCustom 
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20' 
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                  }`}>
                    {isCustom ? (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v10"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">{c.name}</h4>
                      {isCustom && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30">
                          Custom
                        </span>
                      )}
                      {ver && !isCustom && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-base-300/50 text-base-content/60">
                          v{ver}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {isCustom ? 'Custom local installation' : 'Official release channel'}
                    </p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isInstalled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-base-content/20'}`}></div>
                </div>
                
                {/* Path Display */}
                {isInstalled && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-base-300/30 border border-white/5">
                    <code className="text-xs text-base-content/50 font-mono break-all">
                      {dir}
                    </code>
                  </div>
                )}
                
                {/* Action Buttons - Full Text with Tooltips */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    className="btn btn-sm btn-ghost border border-white/10 hover:border-white/20 gap-2" 
                    disabled={!dir} 
                    onClick={() => dir && openFolder(dir)}
                    title="Open installation folder"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Browse
                  </button>
                  
                  {!isCustom && (
                    <>
                      <button 
                        className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                        disabled={!dir || busy} 
                        onClick={() => repairChannel(c.name)}
                        title="Verify and repair game files"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                        Repair
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                        disabled={!dir || busy} 
                        onClick={() => hdTexturesInstalled ? uninstallHdTextures(c.name) : installHdTextures(c.name)}
                        title={hdTexturesInstalled ? 'Remove high resolution textures' : 'Install high resolution textures'}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                        {hdTexturesInstalled ? 'Remove HD' : 'HD Textures'}
                      </button>
                      {(() => {
                        const dedi = (c as any)?.dedi_url as string | undefined;
                        if (!dedi) return null;
                        return (
                          <a 
                            className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                            href={dedi}
                            title="Download dedicated server"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                              <line x1="6" y1="6" x2="6.01" y2="6"/>
                              <line x1="6" y1="18" x2="6.01" y2="18"/>
                            </svg>
                            Dedicated Server
                          </a>
                        );
                      })()}
                    </>
                  )}
                  
                  {isInstalled && (
                    <button 
                      className="btn btn-sm btn-ghost border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-red-400 hover:text-red-300 gap-2 ml-auto" 
                      disabled={busy} 
                      onClick={() => onUninstallClick(c.name)}
                      title="Uninstall this channel"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      Uninstall
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
