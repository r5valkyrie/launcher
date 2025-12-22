import React, { useRef, useEffect, useState } from 'react';
import { animations } from '../common/animations';

type Channel = { name: string };
export type ActiveTab = 'general' | 'mods' | 'servers' | 'launch' | 'settings';

type PartInfo = { received: number; total: number };
type FileInfo = { status: string; received?: number; total?: number; totalParts?: number; parts?: Record<number, PartInfo> };

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
  // Tab navigation props
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  // Progress props (for integrated progress display)
  hasStarted?: boolean;
  isPaused?: boolean;
  currentOperation?: string;
  bytesTotal?: number;
  bytesReceived?: number;
  speedBps?: number;
  etaSeconds?: number;
  doneCount?: number;
  totalCount?: number;
  progressItems?: Record<string, FileInfo>;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
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
    id: 'servers',
    label: 'Servers',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
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
    // Progress props
    hasStarted = false,
    isPaused = false,
    currentOperation = 'Installing',
    bytesTotal = 0,
    bytesReceived = 0,
    speedBps = 0,
    etaSeconds = 0,
    doneCount = 0,
    totalCount = 0,
    progressItems = {},
    onPause,
    onResume,
    onCancel,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);

  // Should we show the progress instead of buttons?
  const showProgress = busy && hasStarted;

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

  // Close channel dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
    };
    if (channelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [channelDropdownOpen]);

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    animations.buttonHover(e.currentTarget);
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    animations.buttonHoverOut(e.currentTarget);
  };

  // Progress helpers
  const progressPercent = bytesTotal > 0 ? Math.min(100, (bytesReceived / bytesTotal) * 100) : 0;
  const speedMBps = speedBps / (1024 * 1024);
  const etaMinutes = Math.floor(etaSeconds / 60);
  const etaSecondsRemainder = Math.floor(etaSeconds % 60);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatEta = () => {
    if (etaSeconds <= 0) return '--';
    if (etaMinutes >= 60) {
      const hours = Math.floor(etaMinutes / 60);
      const mins = etaMinutes % 60;
      return `${hours}h ${mins}m`;
    }
    if (etaMinutes > 0) return `${etaMinutes}m ${etaSecondsRemainder}s`;
    return `${etaSecondsRemainder}s`;
  };

  // Get active downloads
  const activeItems = Object.entries(progressItems)
    .filter(([_, info]) => info.status === 'downloading' || info.status === 'verifying' || info.status?.includes('downloading') || info.status?.includes('merging'))
    .slice(0, 3);

  // Count statuses
  const statusCounts = Object.values(progressItems).reduce((acc, info) => {
    const status = info.status || '';
    if (status === 'downloading' || status.includes('downloading') || status.includes('parts')) {
      acc['downloading'] = (acc['downloading'] || 0) + 1;
    } else if (status === 'verifying') {
      acc['verifying'] = (acc['verifying'] || 0) + 1;
    } else if (status.includes('merging')) {
      acc['merging'] = (acc['merging'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const downloadingCount = statusCounts['downloading'] || 0;
  const verifyingCount = statusCounts['verifying'] || 0;
  const mergingCount = statusCounts['merging'] || 0;

  const getCurrentPhase = () => {
    if (downloadingCount > 0) return 'Downloading';
    if (mergingCount > 0) return 'Merging';
    if (verifyingCount > 0) return 'Verifying';
    return 'Processing';
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

            {/* Channel Selector - Smart switcher: pills for ≤3 channels, dropdown for 4+ */}
            {enabledChannels.length > 0 && (
              <div className="flex items-center gap-3">
                {/* Label */}
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Release Channel</span>
                
                {/* Pills for 3 or fewer channels */}
                {enabledChannels.length <= 3 ? (
                  <div className="flex gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                    {enabledChannels.map((c) => (
                      <button
                        key={c.name}
                        className={`relative px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                          selectedChannel === c.name 
                            ? 'bg-gradient-to-br from-primary/15 to-primary/10 text-white border border-primary/25 shadow-sm shadow-primary/10' 
                            : 'text-white/55 hover:text-white/90 hover:bg-white/[0.05]'
                        }`}
                        onClick={() => setSelectedChannel(c.name)}
                      >
                        {/* Channel name */}
                        <span className="relative z-10">{c.name}</span>
                        
                        {/* Subtle active indicator */}
                        {selectedChannel === c.name && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Dropdown for 4+ channels */
                  <div className="relative" ref={channelDropdownRef}>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-primary/15 to-primary/10 text-white border border-primary/25 shadow-sm shadow-primary/10 hover:from-primary/20 hover:to-primary/15 transition-all duration-200 min-w-[140px]"
                      onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                    >
                      <span className="text-xs font-medium flex-1 text-left">{selectedChannel}</span>
                      <svg 
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${channelDropdownOpen ? 'rotate-180' : ''}`} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    {channelDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[#1b2026] border border-white/10 rounded-lg shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-xl z-50 dropdown-enter">
                        <div className="py-1 max-h-80 overflow-y-auto scrollbar-thin">
                          {enabledChannels.map((c) => (
                            <button
                              key={c.name}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                                selectedChannel === c.name
                                  ? 'bg-primary/15 text-white border-l-2 border-primary'
                                  : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                              }`}
                              onClick={() => {
                                setSelectedChannel(c.name);
                                setChannelDropdownOpen(false);
                              }}
                            >
                              <span className="font-medium">{c.name}</span>
                              {selectedChannel === c.name && (
                                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hero Banner Content */}
        <div className={`relative overflow-hidden transition-all duration-500 ease-out ${showProgress ? 'h-[340px]' : 'h-[280px]'}`}>
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
            className={`absolute right-0 bottom-0 w-auto object-contain object-right-bottom pointer-events-none transition-all duration-500 ${showProgress ? 'h-[350px] opacity-50' : 'h-[290px] opacity-100'}`}
          />

          {/* Content */}
          <div className="relative z-10 h-full w-full flex flex-col items-start justify-end p-6">
            <div className={`flex flex-col gap-4 transition-all duration-500 ${showProgress ? 'w-full max-w-full' : 'max-w-[60%]'}`}>
              {/* Logo and Tagline */}
              <div className="hero-logo">
                <img 
                  ref={logoRef} 
                  src="r5v_tempLogo.png" 
                  alt="R5Valkyrie" 
                  className="h-16 w-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]" 
                />
                <div className="text-sm text-white/70 mt-1.5 hero-text drop-shadow-md font-medium tracking-wide">
                  Pilots. Legends. One Frontier. One Battle.
                </div>
              </div>

              {/* Action Buttons (when not downloading) */}
              {!showProgress && (
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
              )}

              {/* Integrated Progress Display (when downloading) */}
              {showProgress && (
                <div className="w-full space-y-4 animate-fadeSlideIn">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Animated icon */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30 ${isPaused ? '' : 'animate-pulse'}`}>
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="7,10 12,15 17,10" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
                          </svg>
                        </div>
                        {!isPaused && (
                          <div className="absolute inset-0 rounded-xl bg-primary/30 animate-ping" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white drop-shadow-md">{currentOperation}</h3>
                          {isPaused ? (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30 backdrop-blur-sm flex items-center gap-1.5">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                              Paused
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30 backdrop-blur-sm">
                              {getCurrentPhase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
                          {totalCount > 0 && (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                              {doneCount} / {totalCount} files
                            </span>
                          )}
                          {bytesTotal > 0 && (
                            <span>{formatBytes(bytesReceived)} / {formatBytes(bytesTotal)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {onPause && onResume && (
                        <button 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                            isPaused 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                          onClick={isPaused ? onResume : onPause}
                          title={isPaused ? 'Resume download' : 'Pause download'}
                        >
                          {isPaused ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          )}
                        </button>
                      )}
                      {onCancel && (
                        <button 
                          className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                          onClick={onCancel}
                          title="Cancel operation"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Progress Bar */}
                  <div className="relative">
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ease-out relative ${isPaused ? 'bg-amber-500/70' : 'bg-gradient-to-r from-primary to-cyan-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      >
                        {!isPaused && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        )}
                      </div>
                    </div>
                    
                    {/* Percentage badge */}
                    <div 
                      className="absolute -top-1 transform -translate-x-1/2 bg-[#1b2026] border border-white/20 px-2 py-0.5 rounded-md text-xs font-mono font-medium shadow-lg transition-all duration-300"
                      style={{ left: `max(24px, min(calc(${progressPercent}%), calc(100% - 24px)))` }}
                    >
                      {progressPercent.toFixed(1)}%
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4">
                    {/* Speed */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/10 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-medium text-white/90">
                        {isPaused ? 'Paused' : speedMBps > 0 ? `${speedMBps.toFixed(1)} MB/s` : '--'}
                      </span>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/10 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-medium text-white/90">{isPaused ? '--' : formatEta()}</span>
                    </div>

                    {/* Active Tasks */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/10 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {downloadingCount > 0 && <span className="text-cyan-400">{downloadingCount}</span>}
                        {downloadingCount > 0 && (verifyingCount > 0 || mergingCount > 0) && <span className="text-white/30">·</span>}
                        {mergingCount > 0 && <span className="text-purple-400">{mergingCount}</span>}
                        {mergingCount > 0 && verifyingCount > 0 && <span className="text-white/30">·</span>}
                        {verifyingCount > 0 && <span className="text-amber-400">{verifyingCount}</span>}
                        {downloadingCount === 0 && verifyingCount === 0 && mergingCount === 0 && <span className="text-white/40">--</span>}
                      </span>
                    </div>

                    {/* Expand details button */}
                    {activeItems.length > 0 && (
                      <button 
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/20 border border-white/10 backdrop-blur-sm text-white/60 hover:text-white/90 hover:border-white/20 transition-all"
                        onClick={() => setShowDetails(!showDetails)}
                      >
                        <span className="text-xs font-medium">{showDetails ? 'Hide' : 'Details'}</span>
                        <svg 
                          className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* File Details (expandable) */}
                  {showDetails && activeItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10 animate-fadeSlideIn">
                      {activeItems.map(([path, info]) => {
                        const filename = path.split(/[/\\]/).pop() || path;
                        const isMultipart = (info.totalParts || 0) > 0;
                        const parts = info.parts || {};
                        
                        let displayProgress = 0;
                        let displayReceived = 0;
                        let displayTotal = 0;
                        
                        if (isMultipart && info.totalParts && info.totalParts > 0) {
                          let bytesReceivedParts = 0;
                          let bytesTotalParts = 0;
                          
                          for (let i = 0; i < info.totalParts; i++) {
                            const part = (parts as Record<string | number, PartInfo>)[i] || (parts as Record<string | number, PartInfo>)[String(i)];
                            if (part) {
                              bytesReceivedParts += (part.received || 0);
                              bytesTotalParts += (part.total || 0);
                            }
                          }
                          
                          if (bytesTotalParts > 0) {
                            displayProgress = Math.min(100, (bytesReceivedParts / bytesTotalParts) * 100);
                          }
                          
                          displayReceived = bytesReceivedParts;
                          displayTotal = bytesTotalParts;
                        } else {
                          displayReceived = info.received || 0;
                          displayTotal = info.total || 0;
                          displayProgress = displayTotal > 0 ? Math.min(100, (displayReceived / displayTotal) * 100) : 0;
                        }
                        
                        if (!Number.isFinite(displayProgress)) displayProgress = 0;

                        const getStatusType = (status: string) => {
                          if (status === 'downloading' || status.includes('downloading') || status.includes('parts')) return 'downloading';
                          if (status.includes('merging')) return 'merging';
                          if (status === 'verifying') return 'verifying';
                          return 'downloading';
                        };
                        const statusType = getStatusType(info.status);

                        const getProgressColor = () => {
                          if (statusType === 'downloading') return 'bg-cyan-500';
                          if (statusType === 'merging') return 'bg-purple-500';
                          if (statusType === 'verifying') return 'bg-amber-500';
                          return 'bg-blue-500';
                        };

                        return (
                          <div key={path} className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-black/20 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-sm font-medium text-white/80 truncate" title={path}>{filename}</span>
                              {isMultipart && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/50 flex-shrink-0">
                                  {info.totalParts}p
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${getProgressColor()}`}
                                  style={{ width: `${Math.max(0, Math.min(100, displayProgress)).toFixed(1)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-white/60 w-8 text-right">
                                {Math.floor(displayProgress)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay on top of the whole container for extra depth */}
      <img src="r5v_bannerBG_gradient.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-2xl opacity-40" />
    </div>
  );
}
