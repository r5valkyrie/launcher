import React from 'react';
import DownloadOptimizer from '../ui/DownloadOptimizer';

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
  customBaseDir: string;
  setCustomBaseDir: (dir: string) => void;
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
  repairChannel: (name: string) => void;
  fixChannelPermissions: (name: string) => void;
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
    channel,
    enabledChannels,
    channelsSettings,
    concurrency,
    setConcurrency,
    partConcurrency,
    setPartConcurrency,
    downloadSpeedLimit,
    setDownloadSpeedLimit,
    customBaseDir,
    setCustomBaseDir,
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
    repairChannel,
    fixChannelPermissions,
    setSetting,
    openExternal,
    openFolder,
    optimizeForSpeed,
    optimizeForStability,
    resetDownloadDefaults,
    installHdTextures,
    uninstallHdTextures,
  } = props;

  return (
    <div key="content-settings" className="space-y-6 fade-in pb-6">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Download Performance */}
        <div className="xl:col-span-2">
          <DownloadOptimizer
            concurrency={concurrency}
            setConcurrency={(value) => {
              setConcurrency(value);
              setSetting('concurrency', value);
            }}
            partConcurrency={partConcurrency}
            setPartConcurrency={(value) => {
              setPartConcurrency(value);
              setSetting('partConcurrency', value);
            }}
            onOptimizeForSpeed={optimizeForSpeed}
            onOptimizeForStability={optimizeForStability}
            onResetToDefaults={resetDownloadDefaults}
          />
        </div>

        {/* Download Speed Limit */}
        <div className="xl:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Download Speed Limit</h3>
              <p className="text-xs text-base-content/50">Cap maximum download speed across all downloads</p>
            </div>
          </div>

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

            <div className="grid grid-cols-5 gap-2">
              {[0, 5, 10, 25, 50].map((mbps) => (
                <button
                  key={mbps}
                  className={`btn btn-sm ${downloadSpeedLimit === mbps * 1024 * 1024 ? 'btn-warning' : 'btn-ghost border border-white/10 hover:border-amber-500/30'}`}
                  onClick={async () => {
                    const value = mbps * 1024 * 1024;
                    setDownloadSpeedLimit(value);
                    await setSetting('downloadSpeedLimit', value);
                    if (window.electronAPI?.setDownloadSpeedLimit) {
                      await window.electronAPI.setDownloadSpeedLimit(value);
                    }
                  }}
                >
                  {mbps === 0 ? '∞' : `${mbps}`}
                </button>
              ))}
            </div>

            <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-base-content/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1 text-base-content/80">Global Speed Cap</div>
                  <p className="text-xs text-base-content/50 leading-relaxed">This limit applies to all downloads (game files, mods, etc.). Set to unlimited for maximum speed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Base Directory */}
        <div className="xl:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Default Install Location</h3>
              <p className="text-xs text-base-content/50">Set a custom base directory for game installations</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Base Directory</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-1 font-mono text-sm bg-base-300/30 border-white/10 focus:border-primary/50"
                  value={customBaseDir}
                  onChange={(e) => setCustomBaseDir(e.target.value)}
                  onBlur={async (e) => {
                    await setSetting('customBaseDir', e.target.value);
                  }}
                  placeholder="%LOCALAPPDATA%\Programs\R5VLibrary (default)"
                />
                <button
                  className="btn btn-outline border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 gap-2"
                  onClick={async () => {
                    const dir = await window.electronAPI?.selectDirectory?.();
                    if (dir) {
                      setCustomBaseDir(dir);
                      await setSetting('customBaseDir', dir);
                      if (confirm('Custom base directory set! Reload launcher to detect channels in the new location?')) {
                        window.location.reload();
                      }
                    }
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Browse
                </button>
                {customBaseDir && (
                  <button
                    className="btn btn-outline border-white/10 hover:border-red-500/50 hover:bg-red-500/10"
                    onClick={async () => {
                      setCustomBaseDir('');
                      await setSetting('customBaseDir', '');
                      window.location.reload();
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="bg-base-300/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-base-300/50 flex items-center justify-center flex-shrink-0">
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
                    Custom builds in this location will be automatically detected. Leave empty to use the default location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Appearance</h3>
              <p className="text-xs text-base-content/50">Customize the visual experience</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">Banner Video</span>
                  <p className="text-xs text-base-content/40">Enable animated background videos</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-secondary"
                checked={bannerVideoEnabled}
                onChange={async (e) => {
                  const v = e.target.checked;
                  setBannerVideoEnabled(v);
                  await setSetting('bannerVideoEnabled', v);
                }}
              />
            </label>

            {/* Snow Effect - Only show in December */}
            {new Date().getMonth() === 11 && (
              <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 7l-5 5-5-5M7 17l5-5 5 5M2 12h20M7 7l10 10M17 7L7 17"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Holiday Snow Effect</span>
                    <p className="text-xs text-base-content/40">Festive snowfall animation</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-secondary"
                  checked={snowEffectEnabled}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    setSnowEffectEnabled(v);
                    await setSetting('snowEffectEnabled', v);
                  }}
                />
              </label>
            )}

            {easterEggDiscovered && (
              <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M9 9h.01M15 9h.01M9 15h6"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Emoji Letters</span>
                    <p className="text-xs text-base-content/40">Transform text into blue square emojis</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-secondary"
                  checked={emojiMode}
                  onChange={(e) => toggleEmojiMode(e.target.checked)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Mod Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Mod Preferences</h3>
              <p className="text-xs text-base-content/50">Control mod visibility and filtering</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">Deprecated Mods</span>
                  <p className="text-xs text-base-content/40">Show outdated or unsupported mods</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={modsShowDeprecated}
                onChange={async (e) => {
                  const v = e.target.checked;
                  setModsShowDeprecated(v);
                  await setSetting('modsShowDeprecated', v);
                }}
              />
            </label>
            
            <label className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">NSFW Content</span>
                  <p className="text-xs text-base-content/40">Show adult-oriented modifications</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={modsShowNsfw}
                onChange={async (e) => {
                  const v = e.target.checked;
                  setModsShowNsfw(v);
                  await setSetting('modsShowNsfw', v);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Channel Management - Each channel in its own panel */}
      {enabledChannels.map((c) => {
        const ch = channelsSettings?.[c.name];
        const dir = c.isCustom ? c.installDir : ch?.installDir;
        const ver = ch?.gameVersion;
        const isInstalled = !!dir;
        const hdTexturesInstalled = !!ch?.hdTexturesInstalled || !!ch?.includeOptional;
        const isCustom = !!c.isCustom;
        
        return (
          <div key={c.name} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                isCustom 
                  ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-violet-500/20' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20'
              }`}>
                {isCustom ? (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
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
                  {isCustom 
                    ? 'Custom local game installation' 
                    : 'Official release channel'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isInstalled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-base-content/20'}`}></div>
            </div>
            
            <div className="text-xs text-base-content/50 mb-4 font-mono bg-base-300/20 border border-white/5 p-3 rounded-lg break-all">
              {dir || 'Not installed'}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Browse Files button */}
              <button 
                className="btn btn-sm btn-ghost border border-white/10 hover:border-white/20 gap-2" 
                disabled={!dir} 
                onClick={() => dir && openFolder(dir)}
                title="Open folder in file explorer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Browse Files
              </button>
              
              {/* Official channel buttons */}
              {!isCustom && (
                <>
                  <button 
                    className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                    disabled={!dir || busy} 
                    onClick={() => repairChannel(c.name)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    Repair
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                    disabled={!dir || busy} 
                    onClick={() => fixChannelPermissions(c.name)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Fix Permissions
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                    disabled={!dir || busy} 
                    onClick={() => hdTexturesInstalled ? uninstallHdTextures(c.name) : installHdTextures(c.name)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    {hdTexturesInstalled ? 'Uninstall HD Textures' : 'Install HD Textures'}
                  </button>
                  {(() => {
                    const dedi = (c as any)?.dedi_url as string | undefined;
                    if (!dedi) return null;
                    return (
                      <a 
                        className="btn btn-sm btn-ghost border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 gap-2" 
                        href={dedi}                        
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
