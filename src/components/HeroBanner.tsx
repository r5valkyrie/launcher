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
  onOpenSettings: () => void;
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
    onOpenSettings,
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
                <button className="btn btn-lg btn-primary text-white shadow-lg rounded-[1.5vw] min-w-[6rem]" disabled={busy} onClick={openInstallPrompt}>Install</button>
              )}
              {primaryAction === 'update' && (
                <button className="btn btn-lg btn-warning text-white shadow-lg rounded-[1.5vw] min-w-[6rem]" disabled={busy} onClick={() => repairChannel(selectedChannel, true)}>Update</button>
              )}
              {primaryAction === 'play' && (
                <button className={`btn btn-lg btn-error btn-wide text-white shadow-lg shadow-error/20 rounded-[1.5vw] min-w-[6rem] ${playCooldown?'btn-disabled opacity-70':''}`} disabled={busy || playCooldown} onClick={async ()=>{
                  if (busy || launchClickGuardRef.current) return;
                  launchClickGuardRef.current = true;
                  setPlayCooldown(true);
                  const ok = await requireEula();
                  if (!ok) { setTimeout(() => { setPlayCooldown(false); launchClickGuardRef.current = false; }, 300); return; }
                  await getSettingsAndLaunch();
                  setTimeout(() => { setPlayCooldown(false); launchClickGuardRef.current = false; }, 2000);
                }}>{busy ? 'Working…' : 'Play'}</button>
              )}
              <button className="btn btn-lg rounded-[1.5vw] min-w-[3rem]" title="Settings" onClick={onOpenSettings}>
                ⚙
              </button>
            </div>
          </div>
          {enabledChannels.length > 0 && (
            <div className="absolute bottom-8 right-8">
              <div className="btn-group">
                {enabledChannels.map((c) => (
                  <button
                    key={c.name}
                    className={`btn btn-md rounded-[1.5vw] ${selectedChannel===c.name ? 'btn-active btn-primary' : 'btn-ghost'}`}
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
      <img src="r5v_bannerBG_gradient.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-[2vw]" />
      <img src="r5v_bannerCharacters.png" alt="" className="absolute inset-x-6 bottom-0 w-[calc(100%-5%)] h-[300px] object-contain object-bottom origin-bottom transform scale-[1.1] pointer-events-none" />
    </div>
  );
}


