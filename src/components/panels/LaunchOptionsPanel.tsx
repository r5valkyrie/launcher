import React from 'react';
import { createPortal } from 'react-dom';

type LaunchMode = 'CLIENT' | 'HOST' | 'SERVER';

type GameLaunchSectionProps = {
  // Launch mode
  launchMode: LaunchMode;
  setLaunchMode: (mode: LaunchMode) => void;
  
  // Server settings
  hostname: string;
  setHostname: (hostname: string) => void;
  hostdesc: string;
  setHostdesc: (hostdesc: string) => void;
  visibility: number;
  setVisibility: (visibility: number) => void;
  serverPassword: string;
  setServerPassword: (password: string) => void;
  hostport: string;
  setHostport: (port: string) => void;
  map: string;
  setMap: (map: string) => void;
  playlist: string;
  setPlaylist: (playlist: string) => void;
  availableMaps: string[];
  availablePlaylists: Array<{id: string, name: string}>;

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
    hostdesc,
    setHostdesc,
    visibility,
    setVisibility,
    serverPassword,
    setServerPassword,
    hostport,
    setHostport,
    map,
    setMap,
    playlist,
    setPlaylist,
    availableMaps,
    availablePlaylists,
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
        return 'Join and play on community servers or with friends';
      case 'HOST':
        return 'Play while hosting - you and friends on your machine';
      case 'SERVER':
        return 'Run a dedicated server without playing yourself';
    }
  };

  const getModeDetails = (mode: LaunchMode) => {
    switch (mode) {
      case 'CLIENT':
        return { 
          bestFor: 'Most Players', 
          badge: 'Recommended',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          info: 'Standard mode for joining any game'
        };
      case 'HOST':
        return { 
          bestFor: 'Playing with Friends', 
          badge: 'Casual',
          badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          info: 'Good for small groups & LAN parties'
        };
      case 'SERVER':
        return { 
          bestFor: 'Advanced Users', 
          badge: 'Advanced',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          info: 'Best performance for 24/7 servers'
        };
    }
  };

  const ToggleCard = ({ 
    checked, 
    onChange, 
    label, 
    description, 
    icon,
    accentColor = 'blue',
    tooltip
  }: { 
    checked: boolean; 
    onChange: (v: boolean) => void; 
    label: string; 
    description?: string;
    icon: React.ReactNode;
    accentColor?: string;
    tooltip?: string;
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
      <label 
        className="flex items-center justify-between p-4 rounded-xl bg-base-300/20 border border-white/5 hover:border-white/10 transition-all cursor-pointer group hover:bg-base-300/30"
        title={tooltip}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${colorMap[accentColor]}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{label}</span>
              {tooltip && (
                <div className="tooltip tooltip-right" data-tip={tooltip}>
                  <svg className="w-3.5 h-3.5 text-base-content/30 hover:text-base-content/60 transition-colors cursor-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              )}
            </div>
            {description && <p className="text-xs text-base-content/40 mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </div>
        <input 
          type="checkbox" 
          className={`toggle ${toggleColorMap[accentColor]} flex-shrink-0`}
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

  const SelectField = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    icon,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{value: string, label: string}>;
    placeholder?: string;
    icon?: React.ReactNode;
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    React.useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : (placeholder || 'Select...');

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-base-content/70 flex items-center gap-2">
          {icon && <span className="text-base-content/40">{icon}</span>}
          {label}
        </label>
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            className="w-full px-4 py-2.5 rounded-lg bg-base-300/30 border border-white/10 hover:border-white/20 focus:border-primary/50 text-left flex items-center justify-between transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={selectedOption ? 'text-base-content' : 'text-base-content/40'}>
              {displayText}
            </span>
            <svg 
              className={`w-4 h-4 text-base-content/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          {isOpen && createPortal(
            <div 
              ref={dropdownRef}
              className="fixed z-[9999] rounded-lg bg-[#1a1f26] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
            >
              {!value && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-base-content/40 hover:bg-white/5 transition-colors text-sm"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                >
                  {placeholder || 'Select...'}
                </button>
              )}
              <div className="max-h-64 overflow-y-auto overlay-scroll">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`w-full px-4 py-2.5 text-left transition-colors text-sm ${
                      value === opt.value
                        ? 'bg-primary/20 text-primary-content hover:bg-primary/30'
                        : 'text-base-content hover:bg-white/5'
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {value === opt.value && (
                        <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    );
  };

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
          description="How do you want to play?"
          gradient="from-blue-500 to-indigo-600"
        />

        {/* Helpful guide */}
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-xs text-blue-400/90 leading-relaxed">
              <span className="font-semibold">Not sure which to pick?</span> Choose <span className="font-semibold">Client</span> to join online matches. 
              Choose <span className="font-semibold">Host</span> if you want to play with friends on your PC. 
              Choose <span className="font-semibold">Server</span> only if setting up a dedicated 24/7 server.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['CLIENT', 'HOST', 'SERVER'] as LaunchMode[]).map((mode) => {
            const details = getModeDetails(mode);
            return (
              <button
                key={mode}
                onClick={() => setLaunchMode(mode)}
                className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                  launchMode === mode
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-white/10 bg-base-300/20 hover:border-white/20 hover:bg-base-300/30'
                }`}
              >
                {/* Badge */}
                <div className="absolute top-3 right-3">
                  {launchMode === mode ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${details.badgeColor}`}>
                      {details.badge}
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${
                  launchMode === mode
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/30'
                    : 'bg-base-300/50 text-base-content/60 group-hover:bg-base-300'
                }`}>
                  {getModeIcon(mode)}
                </div>

                {/* Title */}
                <h5 className="font-semibold text-lg mb-1">{mode}</h5>
                
                {/* Description */}
                <p className="text-xs text-base-content/60 mb-3 leading-relaxed">{getModeDescription(mode)}</p>
                
                {/* Divider */}
                <div className="border-t border-white/10 my-3"></div>
                
                {/* Best For & Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-base-content/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="text-[11px] font-semibold text-base-content/50">Best for:</span>
                    <span className="text-[11px] font-medium text-base-content/70">{details.bestFor}</span>
                  </div>
                  <p className="text-[10px] text-base-content/40 leading-relaxed pl-4.5">{details.info}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Server Configuration - Only for SERVER mode */}
        {launchMode === 'SERVER' && (
          <div className="mt-5 p-5 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2"/>
                  <rect x="2" y="14" width="20" height="8" rx="2"/>
                  <line x1="6" y1="6" x2="6.01" y2="6"/>
                  <line x1="6" y1="18" x2="6.01" y2="18"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-base">Server Configuration</h4>
                <p className="text-xs text-base-content/50">Configure your dedicated server settings</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-3">
                <InputField
                  label="Server Name"
                  value={hostname}
                  onChange={setHostname}
                  placeholder="My Awesome R5 Server"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  }
                />
                <InputField
                  label="Server Description"
                  value={hostdesc}
                  onChange={setHostdesc}
                  placeholder="Welcome to my server! Have fun and play fair."
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  }
                />
              </div>

              {/* Visibility & Password */}
              <div className="p-4 rounded-lg bg-base-300/20 border border-white/5 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-base-content/70 flex items-center gap-2">
                    <svg className="w-4 h-4 text-base-content/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Server Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 0, label: 'Offline', desc: 'Not listed', color: 'rose' },
                      { value: 1, label: 'Hidden', desc: 'Join via IP', color: 'amber' },
                      { value: 2, label: 'Public', desc: 'Visible to all', color: 'emerald' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setVisibility(opt.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          visibility === opt.value
                            ? `border-${opt.color}-500 bg-${opt.color}-500/10`
                            : 'border-white/10 bg-base-300/20 hover:border-white/20'
                        }`}
                      >
                        <div className="text-sm font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-base-content/40 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <InputField
                  label="Server Password (optional)"
                  value={serverPassword}
                  onChange={setServerPassword}
                  placeholder="Leave blank for no password"
                  type="password"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  }
                />
              </div>

              {/* Network & Gameplay */}
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Server Port"
                  value={hostport}
                  onChange={setHostport}
                  placeholder="37015"
                  type="number"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  }
                />
                {availablePlaylists.length > 0 ? (
                  <SelectField
                    label="Playlist/Gamemode"
                    value={playlist}
                    onChange={setPlaylist}
                    options={availablePlaylists.map(p => ({ value: p.id, label: p.name }))}
                    placeholder="Select playlist..."
                    icon={
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    }
                  />
                ) : (
                  <InputField
                    label="Playlist/Gamemode"
                    value={playlist}
                    onChange={setPlaylist}
                    placeholder="e.g., survival, survival_duos"
                    icon={
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    }
                  />
                )}
              </div>

              {availableMaps.length > 0 ? (
                <SelectField
                  label="Map"
                  value={map}
                  onChange={setMap}
                  options={availableMaps.map(m => ({ value: m, label: m }))}
                  placeholder="Select map..."
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                />
              ) : (
                <InputField
                  label="Map"
                  value={map}
                  onChange={setMap}
                  placeholder="e.g., mp_rr_canyonlands_mu1"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                />
              )}
            </div>
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
            
            <p className="text-xs text-base-content/50 leading-relaxed">
              <span className="font-semibold">Max FPS:</span> Set to 0 for unlimited. Cap at your monitor's refresh rate (60, 144, 240) to reduce GPU load.
            </p>
            
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
              <span className="text-xs text-base-content/40 mr-2 py-1">Resolution Presets:</span>
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
            <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-xs text-amber-400/90 leading-relaxed">
                Leave as -1 unless you know what you are doing. Only change if experiencing performance issues.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Reserved Cores"
                value={reservedCores}
                onChange={setReservedCores}
                placeholder="-1"
              />
              <InputField
                label="Worker Threads"
                value={workerThreads}
                onChange={setWorkerThreads}
                placeholder="-1"
              />
            </div>
            <div className="text-xs text-base-content/50 space-y-1 pt-2 border-t border-white/5">
              <p><span className="font-semibold">Reserved Cores:</span> Number of CPU cores to reserve for the game</p>
              <p><span className="font-semibold">Worker Threads:</span> Number of threads for background tasks</p>
            </div>
          </div>

          <ToggleCard
            checked={noAsync}
            onChange={setNoAsync}
            label="Disable Async Systems"
            description="Force synchronous loading - may help with crashes on older CPUs"
            accentColor="amber"
            tooltip="Disables asynchronous file loading. Only enable if you're experiencing crashes during map loads."
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
              description="Secure network communication"
              accentColor="cyan"
              tooltip="Encrypts network packets for added security. Recommended for public servers."
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
              label="Random Network Key"
              description="Generate unique connection key"
              accentColor="cyan"
              tooltip="Uses a random encryption key for each session. Improves security."
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
              description="Buffer network data"
              accentColor="cyan"
              tooltip="Queues network packets instead of sending immediately. Can reduce lag spikes on unstable connections."
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              }
            />
            <ToggleCard
              checked={noTimeout}
              onChange={setNoTimeout}
              label="Disable Timeouts"
              description="Prevent connection drops"
              accentColor="cyan"
              tooltip="Disables network timeout checks. Useful when debugging or on slow connections."
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

          <div className="p-4 rounded-xl bg-base-300/20 border border-white/5 space-y-3">
            <InputField
              label="Playlist File"
              value={playlistFile}
              onChange={setPlaylistFile}
              placeholder="playlists_r5_patch.txt"
            />
            <p className="text-xs text-base-content/50 leading-relaxed">
              <span className="font-semibold">Playlist File:</span> Specifies which game modes are available. Default is recommended for most players.
            </p>
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
            description="Enable dev console"
            accentColor="rose"
            tooltip="Enables developer mode and console commands for debugging and testing."
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
            description="Enable cheat commands"
            accentColor="rose"
            tooltip="Allows cheat commands like sv_cheats. For single-player or private testing only."
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
          />
          <ToggleCard
            checked={offlineMode}
            onChange={setOfflineMode}
            label="Offline Mode"
            description="No masterserver"
            accentColor="rose"
            tooltip="Launches without connecting to the masterserver. Play solo or on local network."
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
            label="Discord Status"
            description="Show activity"
            accentColor="emerald"
            tooltip="Displays what you're playing in Discord as your status/activity."
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
          />
        </div>

        <div className="p-5 rounded-xl bg-base-300/20 border border-white/5">
          <div className="flex items-start gap-2 mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div className="text-xs text-blue-400/90 leading-relaxed">
              <p className="font-semibold mb-1">For Advanced Users</p>
              <p className="text-blue-400/70">Add custom launch arguments (e.g., -debug, +map mp_lobby). Separate with spaces.</p>
            </div>
          </div>
          <InputField
            label="Custom Command Line"
            value={customCmd}
            onChange={setCustomCmd}
            placeholder="-debug +map mp_rr_canyonlands_mu1"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            }
          />
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
