import React from 'react';

type Channel = { name: string };

type HeroBannerProps = {
  bgVideo?: string;
  videoFilename?: string | null;
  setVideoSrc: (src: string | null) => void;
  primaryAction: 'install' | 'update' | 'play';
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
};

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
  } = props;

  return (
    <div className="relative mx-6 mt-12 mb-6 overflow-visible">
      <div className="relative h-[250px] rounded-[2.3vw] overflow-hidden will-change-auto">
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

        <div className="absolute inset-0 bg-gradient-to-t from-base-100/70 via-base-100/10 to-transparent pointer-events-none"/>
        <div className="relative z-10 h-full w-full flex flex-col items-start justify-start p-9">
          <div className="flex flex-col h-full w-full">
            <div>
              <img src="r5v_tempLogo.png" alt="R5 Valkyrie" className="h-14 md:h-15 lg:h-13 w-auto" />
              <div className="text-md opacity-80 mt-2">Pilots. Legends. One Frontier. One Battle.</div>
            </div>
            <div className="mt-auto flex items-center gap-3 pb-1">
              {primaryAction === 'install' && (
                <button className="btn btn-lg btn-primary text-white shadow-lg rounded-[1.5vw] min-w-[6rem] gap-2" disabled={busy} onClick={openInstallPrompt}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Install
                </button>
              )}
              {primaryAction === 'update' && (
                <button className="btn btn-lg btn-warning text-white shadow-lg rounded-[1.5vw] min-w-[6rem] gap-2" disabled={busy} onClick={() => repairChannel(selectedChannel, true)}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                  Update
                </button>
              )}
              {primaryAction === 'play' && (
                <button className={`btn btn-lg btn-error btn-wide text-white shadow-lg shadow-error/20 rounded-[1.5vw] min-w-[6rem] gap-2 ${playCooldown?'btn-disabled opacity-70':''}`} disabled={busy || playCooldown} onClick={async ()=>{
                  if (busy || launchClickGuardRef.current) return;
                  launchClickGuardRef.current = true;
                  setPlayCooldown(true);
                  const ok = await requireEula();
                  if (!ok) { setTimeout(() => { setPlayCooldown(false); launchClickGuardRef.current = false; }, 300); return; }
                  await getSettingsAndLaunch();
                  setTimeout(() => { setPlayCooldown(false); launchClickGuardRef.current = false; }, 2000);
                }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  {busy ? 'Working…' : 'Play'}
                </button>
              )}
              <button className="btn btn-lg rounded-[1.5vw] min-w-[3rem]" title="Launch Options" onClick={onOpenLaunchOptions}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>
          {enabledChannels.length > 0 && (
            <div className="absolute bottom-[40px] right-6 text-right">
              <div className="text-xs text-white/60 mb-2 font-medium">Release Channel</div>
              <div className="glass rounded-xl p-1 border border-white/20 backdrop-blur-md">
                <div className="flex gap-1">
                  {enabledChannels.map((c) => (
                    <button
                      key={c.name}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedChannel === c.name 
                          ? 'bg-primary text-primary-content shadow-lg shadow-primary/25' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedChannel(c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <img src="r5v_bannerBG_gradient.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-[2vw]" />
      <img src="r5v_bannerCharacters.png" alt="" className="absolute inset-x-6 bottom-0 w-[calc(100%-5%)] h-[300px] object-contain object-bottom origin-bottom transform scale-[1.1] pointer-events-none" />
    </div>
  );
}


