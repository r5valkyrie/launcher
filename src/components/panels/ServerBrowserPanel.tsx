import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Server = {
  name: string;
  description: string;
  map: string;
  ip: string;
  port: string;
  playlist: string;
  key: string;
  hidden: string;
  numPlayers: string;
  maxPlayers: string;
  checksum: string;
  playerCount: string;
  region: string;
  hasPassword: string;
  requiredMods: string;
  enabledMods: string;
  password: string;
  modsProfile?: string; // Thunderstore profile code
  requiredModsList?: string[]; // Array of mod names in format ["Author-ModName"]
  enabledModsList?: string[]; // Array of enabled mod names
};

type ServerBrowserPanelProps = {
  launchGame?: (server: Server) => void;
  onClickInstallModProfile?: (server: Server) => void;
  onApplyProfile?: (profileCode: string) => void;
  activeProfileCode?: string | null;
  existingProfiles?: Array<{ id: string; thunderstoreCode?: string }>;
};

const ServerBrowserPanel: React.FC<ServerBrowserPanelProps> = ({ 
  launchGame, 
  onClickInstallModProfile, 
  onApplyProfile,
  activeProfileCode,
  existingProfiles = []
}) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [hideEmpty, setHideEmpty] = useState(false);
  const [hideFull, setHideFull] = useState(false);
  const [hidePassword, setHidePassword] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'players' | 'map'>('players');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchServers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await window.electronAPI?.fetchServers?.();
      
      if (!result) {
        throw new Error('API not available');
      }
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch servers');
      }
      
      const data = result.data;
      
      if (data && data.success && Array.isArray(data.servers)) {
        // Parse the mod lists from JSON strings
        const serversWithParsedMods = data.servers.map((server: Server) => {
          try {
            // Parse requiredMods JSON string to array
            if (server.requiredMods && typeof server.requiredMods === 'string') {
              server.requiredModsList = JSON.parse(server.requiredMods);
            }
            // Parse enabledMods JSON string to array
            if (server.enabledMods && typeof server.enabledMods === 'string') {
              server.enabledModsList = JSON.parse(server.enabledMods);
            }
          } catch (e) {
            // If parsing fails, leave as undefined
            console.warn('Failed to parse mods for server:', server.name, e);
          }
          return server;
        });
        
        setServers(serversWithParsedMods);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch servers');
      console.error('Server fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    // Refresh every 10 seconds
    const interval = setInterval(fetchServers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort servers
  const filteredServers = servers.filter(server => {
    // Search filter
    if (searchQuery && !server.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !server.map.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !server.playlist.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Region filter
    if (regionFilter !== 'all' && server.region !== regionFilter) {
      return false;
    }

    // Empty server filter
    if (hideEmpty && parseInt(server.playerCount) === 0) {
      return false;
    }

    // Full server filter
    if (hideFull && parseInt(server.playerCount) >= parseInt(server.maxPlayers)) {
      return false;
    }

    // Password filter
    if (hidePassword && server.hasPassword === 'true') {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'players') {
      return parseInt(b.playerCount) - parseInt(a.playerCount);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'map') {
      return a.map.localeCompare(b.map);
    }
    return 0;
  });

  // Get unique regions
  const regions = Array.from(new Set(servers.map(s => s.region))).filter(Boolean);

  const getMapDisplayName = (map: string) => {
    return map.replace('mp_rr_', '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getPlaylistDisplayName = (playlist: string) => {
    return playlist.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const isProfileSaved = (profileCode: string | undefined) => {
    if (!profileCode) return false;
    return existingProfiles.some(p => p.thunderstoreCode === profileCode);
  };

  // Custom Select Component for styled dropdowns
  const SelectField = ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: Array<{value: string, label: string}>;
    placeholder?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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

    useEffect(() => {
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
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="px-4 py-2 rounded-lg bg-base-300/30 border border-white/10 hover:border-white/20 focus:border-primary/50 text-left flex items-center justify-between transition-colors min-w-[160px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-base-content text-sm' : 'text-base-content/40 text-sm'}>
            {displayText}
          </span>
          <svg 
            className={`w-4 h-4 text-base-content/40 transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`}
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
                  {opt.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Header and Filters Panel */}
        <div className="flex-shrink-0 pb-4">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-base-content/50 mt-1">
                  {loading ? 'Loading servers...' : `${filteredServers.length} server${filteredServers.length !== 1 ? 's' : ''} online`}
                </h3>
              </div>

              <button
                onClick={fetchServers}
                disabled={loading}
                className="btn btn-sm gap-2 hover:scale-105 transition-transform bg-base-300/30 hover:bg-base-300/50 border-white/10"
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                Refresh
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search servers, maps, or playlists..."
              className="input input-bordered w-full pl-10 bg-base-300/30 border-white/10 focus:border-blue-500/50"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Region Filter */}
            <SelectField
              value={regionFilter}
              onChange={setRegionFilter}
              options={[
                { value: 'all', label: 'All Regions' },
                ...regions.map(region => ({ value: region, label: region }))
              ]}
              placeholder="All Regions"
            />

            {/* Sort */}
            <SelectField
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              options={[
                { value: 'players', label: 'Sort by Players' },
                { value: 'name', label: 'Sort by Name' },
                { value: 'map', label: 'Sort by Map' }
              ]}
              placeholder="Sort by Players"
            />

            {/* Quick Filters */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-base-300/20 hover:bg-base-300/40 transition-colors text-sm">
                <input
                  type="checkbox"
                  checked={hideEmpty}
                  onChange={(e) => setHideEmpty(e.target.checked)}
                  className="checkbox checkbox-xs"
                />
                <span>Hide Empty</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-base-300/20 hover:bg-base-300/40 transition-colors text-sm">
                <input
                  type="checkbox"
                  checked={hideFull}
                  onChange={(e) => setHideFull(e.target.checked)}
                  className="checkbox checkbox-xs"
                />
                <span>Hide Full</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-base-300/20 hover:bg-base-300/40 transition-colors text-sm">
                <input
                  type="checkbox"
                  checked={hidePassword}
                  onChange={(e) => setHidePassword(e.target.checked)}
                  className="checkbox checkbox-xs"
                />
                <span>Hide Password</span>
              </label>

              {/* View Toggle */}
              <div className="flex gap-1 bg-base-300/30 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-base-300/50'}`}
                  title="List View"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-base-300/50'}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto pb-8">
        {error && (
          <div className="alert alert-error mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
            <button onClick={fetchServers} className="btn btn-sm">Retry</button>
          </div>
        )}

        {loading && servers.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-base-300/50 rounded-lg"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-base-300/50 rounded w-1/3"/>
                    <div className="h-3 bg-base-300/50 rounded w-1/2"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-base-300/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-base-content/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No servers found</h3>
            <p className="text-sm text-base-content/50">Try adjusting your filters or search query</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredServers.map((server, index) => {
              const playerCount = parseInt(server.playerCount);
              const maxPlayers = parseInt(server.maxPlayers);
              const playerPercent = (playerCount / maxPlayers) * 100;
              const isFull = playerCount >= maxPlayers;
              const isEmpty = playerCount === 0;

              return (
                <div 
                  key={index}
                  className="glass rounded-xl p-4 hover:bg-base-300/30 transition-all group border border-white/5 hover:border-blue-500/30"
                >
                  <div className="flex items-center gap-4">
                    {/* Server Icon/Status */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                      isEmpty ? 'bg-base-300/30 text-base-content/30' :
                      isFull ? 'bg-rose-500/20 text-rose-400' :
                      'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 group-hover:from-blue-500/30 group-hover:to-purple-500/30'
                    }`}>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>

                    {/* Server Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{server.name || 'Unnamed Server'}</h3>
                        {server.hasPassword === 'true' && (
                          <div className="tooltip tooltip-top" data-tip="Password Protected">
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                              Locked
                            </span>
                          </div>
                        )}

                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          server.region === 'US' ? 'bg-blue-500/20 text-blue-400' :
                          server.region === 'EU' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-base-300/30 text-base-content/50'
                        }`}>
                          {server.region || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-base-content/50">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {getMapDisplayName(server.map)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                          </svg>
                          {getPlaylistDisplayName(server.playlist)}
                        </span>
                        {server.description && (
                          <span className="truncate">{server.description}</span>
                        )}
                      </div>
                    </div>

                    {/* Players */}
                    <div className="flex flex-col items-end gap-1 min-w-[100px]">
                      <div className={`font-semibold ${
                        isEmpty ? 'text-base-content/30' :
                        isFull ? 'text-rose-400' :
                        'text-blue-400'
                      }`}>
                        {server.playerCount} / {server.maxPlayers}
                      </div>
                      <div className="w-full h-1.5 bg-base-300/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            isEmpty ? 'bg-base-content/20' :
                            isFull ? 'bg-rose-500' :
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${playerPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-base-content/40">Players</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {(server.modsProfile || (server.enabledModsList && server.enabledModsList.length > 0)) && (
                        <div className="tooltip tooltip-left" data-tip={
                          activeProfileCode === server.modsProfile 
                            ? "Mods Profile Active" 
                            : isProfileSaved(server.modsProfile)
                              ? "Apply Server Mods"
                              : "Install Server Mods"
                        }>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isSaved = isProfileSaved(server.modsProfile);
                              const isActive = activeProfileCode === server.modsProfile;
                              
                              if (isSaved && !isActive && onApplyProfile && server.modsProfile) {
                                // Profile is saved but not active, apply it directly
                                onApplyProfile(server.modsProfile);
                              } else if (!isSaved && onClickInstallModProfile) {
                                // Profile not saved, show modal to download/install
                                onClickInstallModProfile(server);
                              }
                            }}
                            disabled={activeProfileCode === server.modsProfile}
                            className={`btn btn-sm btn-ghost gap-2 hover:scale-105 transition-transform ${
                              activeProfileCode === server.modsProfile
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60 cursor-not-allowed'
                                : isProfileSaved(server.modsProfile)
                                  ? 'border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400'
                                  : 'border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-400'
                            }`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {activeProfileCode === server.modsProfile ? (
                                <polyline points="20 6 9 17 4 12"/>
                              ) : isProfileSaved(server.modsProfile) ? (
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                              ) : (
                                <>
                                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </>
                              )}
                            </svg>
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => launchGame && launchGame(server)}
                        className="btn btn-sm btn-primary gap-2 hover:scale-105 transition-transform"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((server, index) => {
              const playerCount = parseInt(server.playerCount);
              const maxPlayers = parseInt(server.maxPlayers);
              const playerPercent = (playerCount / maxPlayers) * 100;
              const isFull = playerCount >= maxPlayers;
              const isEmpty = playerCount === 0;


              return (
                <div 
                  key={index}
                  className="glass rounded-xl p-5 hover:bg-base-300/30 transition-all group border border-white/5 hover:border-blue-500/30"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate mb-1">{server.name || 'Unnamed Server'}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {server.hasPassword === 'true' && (
                          <div className="tooltip tooltip-top" data-tip="Password Protected">
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                              Locked
                            </span>
                          </div>
                        )}
                        {(server.modsProfile || (server.enabledModsList && server.enabledModsList.length > 0)) && (
                          <div 
                            className="tooltip tooltip-top before:max-w-xs before:whitespace-pre-wrap" 
                            data-tip={
                              activeProfileCode === server.modsProfile 
                                ? "✓ Mods Configured - You have this server's mod profile active" 
                                : server.enabledModsList && server.enabledModsList.length > 0
                                  ? `Server Mods (${server.enabledModsList.length}):\n${server.enabledModsList.slice(0, 10).map(mod => `• ${mod.replace(/-/g, ' - ')}`).join('\n')}${server.enabledModsList.length > 10 ? `\n...and ${server.enabledModsList.length - 10} more` : ''}`
                                  : "Server has a mod profile"
                            }
                          >
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 border flex items-center gap-1 ${
                              activeProfileCode === server.modsProfile 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            }`}>
                              {activeProfileCode === server.modsProfile ? (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </svg>
                              )}
                              {activeProfileCode === server.modsProfile ? 'Mods ✓' : server.enabledModsList && server.enabledModsList.length > 0 ? `${server.enabledModsList.length} Mods` : 'Mods'}
                            </span>
                          </div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          server.region === 'US' ? 'bg-blue-500/20 text-blue-400' :
                          server.region === 'EU' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-base-300/30 text-base-content/50'
                        }`}>
                          {server.region || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="truncate">{getMapDisplayName(server.map)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                      </svg>
                      <span className="truncate">{getPlaylistDisplayName(server.playlist)}</span>
                    </div>
                    {server.description && (
                      <p className="text-xs text-base-content/50 line-clamp-2">{server.description}</p>
                    )}
                  </div>

                  {/* Players Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-base-content/50">Players</span>
                      <span className={`font-semibold ${
                        isEmpty ? 'text-base-content/30' :
                        isFull ? 'text-rose-400' :
                        'text-blue-400'
                      }`}>
                        {server.playerCount} / {server.maxPlayers}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-base-300/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          isEmpty ? 'bg-base-content/20' :
                          isFull ? 'bg-rose-500' :
                          'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ width: `${playerPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => launchGame && launchGame(server)}
                      className="btn btn-sm btn-primary flex-1 gap-2 hover:scale-105 transition-transform"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Join Server
                    </button>
                    {server.modsProfile && (
                      <div className="tooltip tooltip-left" data-tip={
                        activeProfileCode === server.modsProfile 
                          ? "Mods Profile Active" 
                          : isProfileSaved(server.modsProfile)
                            ? "Apply Server Mods"
                            : "Install Server Mods"
                      }>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isSaved = isProfileSaved(server.modsProfile);
                            const isActive = activeProfileCode === server.modsProfile;
                            
                            if (isSaved && !isActive && onApplyProfile && server.modsProfile) {
                              // Profile is saved but not active, apply it directly
                              onApplyProfile(server.modsProfile);
                            } else if (!isSaved && onClickInstallModProfile) {
                              // Profile not saved, show modal to download/install
                              onClickInstallModProfile(server);
                            }
                          }}
                          disabled={activeProfileCode === server.modsProfile}
                          className={`btn btn-sm btn-ghost hover:scale-105 transition-transform ${
                            activeProfileCode === server.modsProfile
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60 cursor-not-allowed'
                              : isProfileSaved(server.modsProfile)
                                ? 'border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400'
                                : 'border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-400'
                          }`}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {activeProfileCode === server.modsProfile ? (
                              <polyline points="20 6 9 17 4 12"/>
                            ) : isProfileSaved(server.modsProfile) ? (
                              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                            ) : (
                              <>
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerBrowserPanel;

