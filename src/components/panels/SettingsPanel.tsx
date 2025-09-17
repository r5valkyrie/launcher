import React from 'react';
import DownloadOptimizer from '../ui/DownloadOptimizer';

type Channel = { name: string; game_url: string };

type SettingsPanelProps = {
  busy: boolean;
  channel: Channel | undefined;
  enabledChannels: Channel[];
  channelsSettings: Record<string, any>;
  concurrency: number;
  setConcurrency: (n: number) => void;
  partConcurrency: number;
  setPartConcurrency: (n: number) => void;
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

      {/* Channel Management */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <span className="text-white text-sm">⚙️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Channel Management</h3>
            <p className="text-xs opacity-70">Manage installed game channels and versions</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {enabledChannels.map((c) => {
            const ch = channelsSettings?.[c.name];
            const dir = ch?.installDir;
            const ver = ch?.gameVersion;
            const isInstalled = !!dir;
            const hdTexturesInstalled = !!ch?.hdTexturesInstalled || !!ch?.includeOptional;
            
            return (
              <div key={c.name} className="p-4 rounded-lg bg-base-200/30 border border-base-300/50">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`badge ${isInstalled ? 'badge-success' : 'badge-ghost'} font-semibold`}>
                    {c.name}
                  </div>
                  {ver && (
                    <div className="badge badge-outline badge-sm">
                      v{ver}
                    </div>
                  )}
                  <div className={`ml-auto w-2 h-2 rounded-full ${isInstalled ? 'bg-success' : 'bg-base-300'}`}></div>
                </div>
                
                <div className="text-xs opacity-70 mb-3 font-mono bg-base-300/30 p-2 rounded">
                  {dir || 'Not installed'}
                </div>
                
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


