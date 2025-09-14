import React from 'react';

type SidebarProps = {
  appVersion?: string;
};

export default function Sidebar({ appVersion }: SidebarProps) {
  return (
    <aside className="sticky top-0 h-full flex flex-col items-center py-4 gap-4 border-r border-white/5 overflow-visible relative z-30">
      <div className="w-16 h-16 grid place-items-center overflow-hidden glass-soft hover:glass-bright transition-all duration-300 group cursor-pointer">
        <img
          src="logo.png"
          alt="R5 Valkyrie"
          className="w-12 h-12 object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse-subtle"
        />
      </div>
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2 pb-2 relative overflow-visible">
        <div className="tooltip tooltip-right [--tooltip-offset:8px] [--tooltip-tail:8px] z-[60]" data-tip="Discord">
          <a className="btn btn-circle btn-ghost btn-sm text-white"
            href='https://discord.gg/69V7aNPSzg'
          >
            <svg className="w-4 h-4" viewBox="0 -28.5 256 256" preserveAspectRatio="xMidYMid">
              <g>
                <path
                  d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                  fill="#FFF"
                ></path>
              </g>
            </svg>
          </a>
        </div>
        <div className="tooltip tooltip-right [--tooltip-offset:8px] [--tooltip-tail:8px] z-[60]" data-tip="Website">
          <a className="btn btn-circle btn-ghost btn-sm text-white"
            href='https://playvalkyrie.org'
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
            </svg>
          </a>
        </div>
        <div className="tooltip tooltip-right [--tooltip-offset:8px] [--tooltip-tail:8px] z-[60]" data-tip="Docs">
          <a className="btn btn-circle btn-ghost btn-sm text-white"
            href='https://playvalkyrie.org/docs'
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 1 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </a>
        </div>
        <div className="tooltip tooltip-right [--tooltip-offset:8px] [--tooltip-tail:8px] z-[60]" data-tip="Blog">
          <a className="btn btn-circle btn-ghost btn-sm text-white"
            href='https://blog.playvalkyrie.org/'
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19h16M4 5h16v14H4z" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </a>
        </div>
        {appVersion && (
          <div className="tooltip tooltip-right [--tooltip-offset:8px] [--tooltip-tail:8px] z-[60]" data-tip={`Version ${appVersion}`}>
            <button className="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}


