import React, { useRef, useEffect } from 'react';
import { animations } from '../common/animations';

type Channel = { name: string };
export type ActiveTab = 'general' | 'mods' | 'launch' | 'settings';

type HeroBannerProps = {
  bgVideo?: string;
  videoFilename?: string | null;
  setVideoSrc: (src: string | null) => void;
  primaryAction: 'install' | 'update' | 'play' | 'repair';
  busy: boolean;
  openInstallPrompt: () => void;
  repairChannel: (name: string, isUpdate?: boolean) => Promise<void> | void;
  selectedChannel: string;
  playCooldown: boolean;
  requireEula: () => Promise<boolean>;
  getSettingsAndLaunch: () => Promise<void>;
  setPlayCooldown: (v: boolean) => void;
  launchClickGuardRef: React.MutableRefObject<boolean>;
  enabledChannels: Channel[];
  setSelectedChannel: (name: string) => void;
  onOpenLaunchOptions: () => void;
  // New tab navigation props
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
};

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'general',
    label: 'Home',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    id: 'mods',
    label: 'Mods',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'launch',
    label: 'Launch Options',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export default function HeroBanner(props: HeroBannerProps) {
  const {
    bgVideo,
    videoFilename,
    setVideoSrc,
    primaryAction,
    busy,
    openInstallPrompt,
    repairChannel,
    selectedChannel,
    playCooldown,
    requireEula,
    getSettingsAndLaunch,
    setPlayCooldown,
    launchClickGuardRef,
    enabledChannels,
    setSelectedChannel,
    onOpenLaunchOptions,
    activeTab,
    onTabChange,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (logoRef.current) {
          animations.logoFloat(logoRef.current);
        }
      } catch (error) {
        console.warn('Logo float animation error:', error);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (tabNavRef.current) {
      animations.slideInRight(tabNavRef.current, 200);
    }
  }, []);

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    animations.buttonHover(e.currentTarget);
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    animations.buttonHoverOut(e.currentTarget);
  };

  return (
    <div ref={containerRef} className="relative mx-6 mt-6 mb-6">
      {/* Unified Glass Container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#1b2026] to-[#171b20] shadow-[0_14px_28px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)]">
        
        {/* Top Navigation Bar */}
        <div className="relative z-20 px-5 py-3 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex items-center justify-between">
            {/* Tab Navigation */}
            <nav 
              ref={tabNavRef} 
              className="flex items-center gap-1"
              style={{ opacity: 0 }}
            >
              {tabs.map((tab, index) => (
                <React.Fragment key={tab.id}>
                  {index > 0 && (
                    <div className="nav-separator" />
                  )}
                  <button
                    className={`nav-tab ${activeTab === tab.id ? 'nav-tab-active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                  >
                    <span className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                      {tab.icon}
                    </span>
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </nav>

            {/* Channel Selector - Moved to top right */}
            {enabledChannels.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Release Channel</span>
                <div className="flex gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
                  {enabledChannels.map((c) => (
                    <button
                      key={c.name}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        selectedChannel === c.name 
                          ? 'bg-gradient-to-r from-primary/90 to-primary/70 text-white shadow-md shadow-primary/20' 
                          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                      }`}
                      onClick={() => setSelectedChannel(c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hero Banner Content */}
        <div className="relative h-[280px] overflow-hidden">
          {/* Background Layers */}
          <img src="r5v_bannerBG.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          {bgVideo && (
            <video
              key={bgVideo}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src={bgVideo}
              onError={() => { if (videoFilename) { setVideoSrc(`https://blaze.playvalkyrie.org/video_backgrounds/${videoFilename}`); } else { setVideoSrc(null); } }}
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#171b20] via-[#171b20]/40 to-transparent pointer-events-none"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#171b20]/60 via-transparent to-transparent pointer-events-none"/>
          
          {/* Character Overlay */}
          <img 
            src="r5v_bannerCharacters.png" 
            alt="" 
            className="absolute right-0 bottom-0 h-[290px] w-auto object-contain object-right-bottom pointer-events-none opacity-100" 
          />

          {/* Content */}
          <div className="relative z-10 h-full w-full flex flex-col items-start justify-end p-6">
            <div className="flex flex-col gap-4 max-w-[60%]">
              {/* Logo and Tagline */}
              <div className="hero-logo">
                <img 
                  ref={logoRef} 
                  src="r5v_tempLogo.png" 
                  alt="R5 Valkyrie" 
                  className="h-16 w-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]" 
                />
                <div className="text-sm text-white/70 mt-1.5 hero-text drop-shadow-md font-medium tracking-wide">
                  Pilots. Legends. One Frontier. One Battle.
                </div>
              </div>

              {/* Action Buttons */}
              <div ref={buttonsRef} className="flex items-center gap-2.5 hero-buttons">
                {primaryAction === 'install' && (
                  <button 
                    className={`group relative flex items-center text-center justify-center gap-2 px-12 py-3.5 rounded-xl text-md font-semibold text-white bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 transition-all duration-200 border border-white/10 ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:from-primary/90 hover:to-primary/70 hover:shadow-primary/40'}`} 
                    disabled={busy} 
                    onClick={openInstallPrompt}
                    onMouseEnter={!busy ? handleButtonHover : undefined}
                    onMouseLeave={!busy ? handleButtonLeave : undefined}
                  >
                    {busy ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    <span>{busy ? 'Working...' : 'Install Game'}</span>
                  </button>
                )}
                {primaryAction === 'update' && (
                  <button 
                    className={`group relative flex items-center text-center justify-center gap-2 px-12 py-3.5 rounded-xl text-md font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 transition-all duration-200 border border-white/10 ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40'}`} 
                    disabled={busy} 
                    onClick={() => repairChannel(selectedChannel, true)}
                    onMouseEnter={!busy ? handleButtonHover : undefined}
                    onMouseLeave={!busy ? handleButtonLeave : undefined}
                  >
                    {busy ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                        <path d="M16 16h5v5"/>
                      </svg>
                    )}
                    <span>{busy ? 'Working...' : 'Update Available'}</span>
                  </button>
                )}
                {primaryAction === 'repair' && (
                  <button 
                    className={`group relative flex items-center text-center justify-center gap-2 px-12 py-3.5 rounded-xl text-md font-semibold text-white bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg shadow-purple-500/25 transition-all duration-200 border border-white/10 ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-400 hover:to-violet-400 hover:shadow-purple-500/40'}`} 
                    disabled={busy} 
                    onClick={() => repairChannel(selectedChannel, false)}
                    onMouseEnter={!busy ? handleButtonHover : undefined}
                    onMouseLeave={!busy ? handleButtonLeave : undefined}
                  >
                    {busy ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                    )}
                    <span>{busy ? 'Working...' : 'Repair Installation'}</span>
                  </button>
                )}
                {primaryAction === 'play' && (
                  <button 
                    className={`group relative flex items-center text-center justify-center gap-2 px-12 py-3.5 rounded-xl text-md font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/25 transition-all duration-200 border border-white/10 ${busy || playCooldown ? 'opacity-50 cursor-not-allowed' : 'hover:from-red-400 hover:to-rose-400 hover:shadow-red-500/40'}`} 
                    disabled={busy || playCooldown} 
                    onClick={async () => {
                      if (busy || launchClickGuardRef.current) return;
                      launchClickGuardRef.current = true;
                      setPlayCooldown(true);
                      const ok = await requireEula();
                      if (!ok) { setTimeout(() => { setPlayCooldown(false); launchClickGuardRef.current = false; }, 300); return; }
                      await getSettingsAndLaunch();
                      setTimeout(() => { setPlayCooldown(false); launchClickGuardRef.current = false; }, 2000);
                    }}
                    onMouseEnter={!(busy || playCooldown) ? handleButtonHover : undefined}
                    onMouseLeave={!(busy || playCooldown) ? handleButtonLeave : undefined}
                  >
                    {busy ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                    )}
                    <span>{busy ? 'Working...' : 'Play'}</span>
                  </button>
                )}
                <button 
                  className="flex items-center justify-center w-13.5 h-13.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-sm border border-white/[0.08] hover:border-white/[0.15] text-white/60 hover:text-white/90 transition-all duration-200" 
                  title="Launch Options" 
                  onClick={onOpenLaunchOptions}
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay on top of the whole container for extra depth */}
      <img src="r5v_bannerBG_gradient.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-2xl opacity-40" />
    </div>
  );
}
