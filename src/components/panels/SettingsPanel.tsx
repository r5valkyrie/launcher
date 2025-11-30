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
  bannerVideoEnabled: boolean;
  setBannerVideoEnabled: (v: boolean) => void;
  modsShowDeprecated: boolean;
  setModsShowDeprecated: (v: boolean) => void;
  modsShowNsfw: boolean;
  setModsShowNsfw: (v: boolean) => void;
  easterEggDiscovered: boolean;
  emojiMode: boolean;
  toggleEmojiMode: (enabled: boolean) => void;
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
    bannerVideoEnabled,
    setBannerVideoEnabled,
    modsShowDeprecated,
    setModsShowDeprecated,
    modsShowNsfw,
    setModsShowNsfw,
    easterEggDiscovered,
    emojiMode,
    toggleEmojiMode,
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning/80 to-warning flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Download Speed Limit</h3>
              <p className="text-xs opacity-70">Cap maximum download speed across all downloads</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Speed: {downloadSpeedLimit === 0 ? 'Unlimited' : `${(downloadSpeedLimit / 1024 / 1024).toFixed(1)} MB/s`}
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
                  // Apply the limit immediately
                  if (window.electronAPI?.setDownloadSpeedLimit) {
                    await window.electronAPI.setDownloadSpeedLimit(value);
                  }
                }}
                className="range range-warning w-full"
              />
              <div className="flex justify-between text-xs opacity-60 mt-1">
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
                  className={`btn btn-sm ${downloadSpeedLimit === mbps * 1024 * 1024 ? 'btn-warning' : 'btn-outline'}`}
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

            <div className="bg-base-200/30 border border-white/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neutral/40 to-neutral/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">💡</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1 text-base-content/90">Global Speed Cap</div>
                  <p className="text-xs text-base-content/70 leading-relaxed">This limit applies to all downloads (game files, mods, etc.). Set to unlimited for maximum speed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center">
              <span className="text-white text-sm">🎨</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Appearance</h3>
              <p className="text-xs opacity-70">Customize the visual experience</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <div>
                <span className="font-medium">Banner Video</span>
                <p className="text-xs opacity-70">Enable animated background videos</p>
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

            {easterEggDiscovered && (
              <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
                <div>
                  <span className="font-medium">Emoji Letters</span>
                  <p className="text-xs opacity-70">Transform text into blue square emojis</p>
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info/80 to-info flex items-center justify-center">
              <span className="text-white text-sm">🔧</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Mod Preferences</h3>
              <p className="text-xs opacity-70">Control mod visibility and filtering</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <div>
                <span className="font-medium">Deprecated Mods</span>
                <p className="text-xs opacity-70">Show outdated or unsupported mods</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-info"
                checked={modsShowDeprecated}
                onChange={async (e) => {
                  const v = e.target.checked;
                  setModsShowDeprecated(v);
                  await setSetting('modsShowDeprecated', v);
                }}
              />
            </label>
            
            <label className="flex items-center justify-between p-3 rounded-lg bg-base-200/50 hover:bg-base-200/70 transition-colors cursor-pointer">
              <div>
                <span className="font-medium">NSFW Content</span>
                <p className="text-xs opacity-70">Show adult-oriented modifications</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-info"
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                <span className="text-white text-sm">
                  {isCustom ? '📁' : '⚙️'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  {isCustom && (
                    <div className="badge badge-primary badge-sm gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                      </svg>
                      Custom Channel
                    </div>
                  )}
                  {ver && !isCustom && (
                    <div className="badge badge-outline badge-sm">
                      v{ver}
                    </div>
                  )}
                  {isCustom && (
                    <div className="text-xs opacity-60">
                      Local installation only
                    </div>
                  )}
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {isCustom 
                    ? 'Custom local game installation' 
                    : 'Official release channel'}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-success' : 'bg-base-300'}`}></div>
            </div>
            
            <div className="text-xs opacity-70 mb-4 font-mono bg-base-200/30 p-3 rounded break-all">
              {dir || 'Not installed'}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Browse Files button - available for all channels with a directory */}
              <button 
                className="btn btn-sm btn-outline btn-accent gap-1" 
                disabled={!dir} 
                onClick={() => dir && openFolder(dir)}
                title="Open folder in file explorer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Browse Files
              </button>
              
              {/* Official channel buttons - not available for custom channels */}
              {!isCustom && (
                <>
                  <button 
                    className="btn btn-sm btn-outline btn-primary" 
                    disabled={!dir || busy} 
                    onClick={() => repairChannel(c.name)}
                  >
                    Repair
                  </button>
                  <button 
                    className="btn btn-sm btn-outline btn-primary" 
                    disabled={!dir || busy} 
                    onClick={() => fixChannelPermissions(c.name)}
                  >
                    Fix Permissions
                  </button>
                  <button 
                    className="btn btn-sm btn-outline btn-primary" 
                    disabled={!dir || busy} 
                    onClick={() => hdTexturesInstalled ? uninstallHdTextures(c.name) : installHdTextures(c.name)}
                  >
                    {hdTexturesInstalled ? 'Uninstall HD Textures' : 'Install HD Textures'}
                  </button>
                  {(() => {
                    const dedi = (c as any)?.dedi_url as string | undefined;
                    if (!dedi) return null;
                    return (
                      <a 
                        className="btn btn-sm btn-outline btn-primary" 
                        href={dedi}                        
                      >
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


