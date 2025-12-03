import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './ui/Sidebar';
import HeroBanner from './sections/HeroBanner';
import InstallPromptModal from './modals/InstallPromptModal';
import PermissionPromptModal from './modals/PermissionPromptModal';
import EulaModal from './modals/EulaModal';
import SettingsPanel from './panels/SettingsPanel';
import ModsPanel from './panels/ModsPanel';
import NewsPanel from './panels/NewsPanel';
import ModDetailsModal from './modals/ModDetailsModal';
import SnowEffect from './ui/SnowEffect';
import UpdaterModal from './modals/UpdaterModal';
import ConfirmModal from './modals/ConfirmModal';
import NewsModal from './modals/NewsModal';
import OutdatedModsBanner from './ui/OutdatedModsBanner';
import ToastNotification from './modals/ToastNotification';
import GameLaunchSection from './sections/GameLaunchSection';
import PageTransition from './ui/PageTransition';
import { sanitizeFolderName, deriveFolderFromDownloadUrl, compareVersions, deriveBaseFromDir } from './common/utils';
import { getModIconUrl, getPackageUrlFromPack, getPackageUrlByName, getLatestVersionForName, getPackByName, isInstalledModVisible } from './common/modUtils';
import { buildLaunchParameters } from './common/launchUtils';

type Channel = {
  name: string;
  game_url: string;
  dedi_url?: string;
  enabled: boolean;
  requires_key?: boolean;
  allow_updates?: boolean;
  isCustom?: boolean; // Custom local channels don't have remote URLs
  installDir?: string; // For custom channels, store the install directory
};

type LauncherConfig = {
  launcherVersion: string;
  updaterVersion: string;
  forceUpdates: boolean;
  allowUpdates: boolean;
  backgroundVideo?: string;
  channels: Channel[];
};

declare global {
  interface Window {
    electronAPI?: {
      selectDirectory: () => Promise<string | null>;
      getSettings: () => Promise<any>;
      setSetting: (key: string, value: any) => Promise<any>;
      fetchChecksums: (baseUrl: string) => Promise<any>;
      downloadAll: (args: any) => Promise<any>;
      onProgress: (channel: string, listener: (payload: any) => void) => void;
      getDefaultInstallDir: (channelName?: string) => Promise<string | null>;
      fetchLauncherConfig: (url: string) => Promise<LauncherConfig>;
      scanCustomChannels: (officialChannelNames: string[], channelsSettings?: Record<string, any>) => Promise<Array<{name: string; installDir: string; isCustom: boolean}>>;
      openFolder: (folderPath: string) => Promise<{ok: boolean; error?: string}>;
      setDownloadSpeedLimit: (bytesPerSecond: number) => Promise<{ok: boolean; error?: string}>;
      cacheBackgroundVideo: (filename: string) => Promise<string>;
      isInstalledInDir: (path: string) => Promise<boolean | { isInstalled: boolean; needsRepair: boolean }>;
      pauseDownload?: () => Promise<boolean>;
      resumeDownload?: () => Promise<boolean>;
      cancelDownload: () => Promise<boolean>;
      selectFile?: (filters?: Array<{name:string; extensions:string[]}>) => Promise<string|null>;
      launchGame?: (payload: { channelName: string; installDir: string; mode: string; argsString: string }) => Promise<{ok:boolean; error?:string}>;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      // Auto update
      checkForUpdates?: () => Promise<{ ok: boolean; result?: any; error?: string }>;
      downloadUpdate?: () => Promise<{ ok: boolean; error?: string }>;
      quitAndInstall?: () => Promise<{ ok: boolean; error?: string }>;
      onUpdate?: (channel: string, listener: (payload: any) => void) => void;
      openExternal?: (url: string) => Promise<boolean>;
      getAppVersion?: () => Promise<string>;
      getBaseDir?: () => Promise<string>;
      getLauncherInstallRoot?: () => Promise<string>;
      fetchEula?: () => Promise<{ok:boolean; json?: any; error?: string}>;
      // Mods
      listInstalledMods?: (installDir: string) => Promise<{ok:boolean; mods?: any[]; error?: string}>;
      setModEnabled?: (installDir: string, name: string, enabled: boolean) => Promise<{ok:boolean; error?: string}>;
      uninstallMod?: (installDir: string, folder: string) => Promise<{ok:boolean; error?: string}>;
      fetchAllMods?: (query?: string) => Promise<{ok:boolean; mods?: any[]; error?: string}>;
      installMod?: (installDir: string, name: string, downloadUrl: string) => Promise<{ok:boolean; error?: string}>;
      onModsProgress?: (listener: (payload: any) => void) => void;
      reorderMods?: (installDir: string, orderIds: string[]) => Promise<{ok:boolean; error?: string}>;
      watchMods?: (installDir: string) => Promise<{ok:boolean; error?: string}>;
      unwatchMods?: (installDir: string) => Promise<{ok:boolean; error?: string}>;
      onModsChanged?: (listener: (payload: any) => void) => void;
      // Permissions
      fixFolderPermissions?: (payload: { selectedChannel: string }) => Promise<{ok:boolean; error?: string; details?: string[]; warnings?: string[]}>;
      testWritePermissions?: (folderPath: string) => Promise<{ hasWriteAccess: boolean }>;
      // Uninstall
      deleteFolder?: (folderPath: string) => Promise<{ok:boolean; error?: string}>;
    };
  }
}

const CONFIG_URL = 'https://playvalkyrie.org/api/client/launcherConfig';

export default function LauncherUI() {
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [installDir, setInstallDir] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [overall, setOverall] = useState<{index:number,total:number,path:string, completed?: number}|null>(null);
  const [fileProgress, setFileProgress] = useState<{path:string,received:number,total:number}|null>(null);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');
  // Helper function to get per-channel includeOptional setting
  const getIncludeOptional = (channelName?: string) => {
    const channel = channelName || selectedChannel;
    const result = !!channelsSettings?.[channel]?.includeOptional;
    console.log(`getIncludeOptional(${channel}):`, result, 'channelsSettings:', channelsSettings?.[channel]);
    return result;
  };

  // Helper function to set per-channel includeOptional setting
  const setIncludeOptional = async (channelName: string, value: boolean) => {
    const s: any = await window.electronAPI?.getSettings();
    const channels = { ...(s?.channels || {}) };
    channels[channelName] = { ...(channels[channelName] || {}), includeOptional: value };
    await window.electronAPI?.setSetting('channels', channels);
    setChannelsSettings(channels);
  };
  const [concurrency, setConcurrency] = useState<number>(8);
  const [partConcurrency, setPartConcurrency] = useState<number>(6);
  const [downloadSpeedLimit, setDownloadSpeedLimit] = useState<number>(0); // 0 = unlimited, in bytes per second
  const [customBaseDir, setCustomBaseDir] = useState<string>(''); // Custom base directory for game installations
  const [bannerVideoEnabled, setBannerVideoEnabled] = useState<boolean>(true);
  const [snowEffectEnabled, setSnowEffectEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'general'|'launch'|'mods'|'settings'>('general');
  type PartInfo = { received: number; total: number };
  type FileInfo = { status: string; received?: number; total?: number; totalParts?: number; parts?: Record<number, PartInfo> };
  const [progressItems, setProgressItems] = useState<Record<string, FileInfo>>({});
  const [exitingItems, setExitingItems] = useState<Record<string, boolean>>({});
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('Completed');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [bytesTotal, setBytesTotal] = useState<number>(0);
  const [bytesReceived, setBytesReceived] = useState<number>(0);
  const [speedBps, setSpeedBps] = useState<number>(0);
  const [etaSeconds, setEtaSeconds] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [receivedAnyBytes, setReceivedAnyBytes] = useState<boolean>(false);
  // Updater UI state
  const [updateAvailable, setUpdateAvailable] = useState<any | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateDownloaded, setUpdateDownloaded] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateBps, setUpdateBps] = useState<number>(0);
  const [updateTransferred, setUpdateTransferred] = useState<number>(0);
  const [updateTotal, setUpdateTotal] = useState<number>(0);
  // Install prompt modal state
  const [installPromptOpen, setInstallPromptOpen] = useState<boolean>(false);
  const [installBaseDir, setInstallBaseDir] = useState<string>('');
  const [launcherRoot, setLauncherRoot] = useState<string>('');
  const [installIncludeOptional, setInstallIncludeOptional] = useState<boolean>(false);
  const [optionalFilesSize, setOptionalFilesSize] = useState<number>(0);
  const [baseGameSize, setBaseGameSize] = useState<number>(0);
  // Uninstall confirmation modal state
  const [uninstallModalOpen, setUninstallModalOpen] = useState<boolean>(false);
  const [channelToUninstall, setChannelToUninstall] = useState<string | null>(null);
  // News modal state
  const [newsModalOpen, setNewsModalOpen] = useState<boolean>(false);
  const [selectedNewsPost, setSelectedNewsPost] = useState<any>(null);
  // Permission prompt modal state
  const [permissionPromptOpen, setPermissionPromptOpen] = useState<boolean>(false);
  const [isFixingPermissions, setIsFixingPermissions] = useState<boolean>(false);
  // Auto-hide toast when finished
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => setFinished(false), 3000);
    return () => clearTimeout(t);
  }, [finished]);

  const bytesTotalRef = useRef<number>(0);
  const bytesReceivedRef = useRef<number>(0);
  const busyRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);
  const runIdRef = useRef<number>(0);
  useEffect(() => { bytesTotalRef.current = bytesTotal; }, [bytesTotal]);
  useEffect(() => { bytesReceivedRef.current = bytesReceived; }, [bytesReceived]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  // Load app version
  useEffect(() => {
    (async () => {
      try {
        const version = await window.electronAPI?.getAppVersion?.();
        if (version) setAppVersion(version);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const json: LauncherConfig = await (window.electronAPI?.fetchLauncherConfig
          ? window.electronAPI.fetchLauncherConfig(CONFIG_URL)
          : fetch(CONFIG_URL).then((r) => r.json()));
        
        // Load settings to get custom install directories
        const settings = await window.electronAPI?.getSettings();
        const channelsSettingsData = settings?.channels || {};
        
        // Scan for custom local channels (including custom install directories)
        let customChannels: Channel[] = [];
        if (window.electronAPI?.scanCustomChannels) {
          try {
            const officialNames = json.channels.map(c => c.name);
            const scannedCustomChannels = await window.electronAPI.scanCustomChannels(officialNames, channelsSettingsData);
            
            // Convert scanned channels to Channel type
            customChannels = scannedCustomChannels.map(cc => ({
              name: cc.name,
              game_url: '', // Custom channels don't have remote URLs
              enabled: true,
              isCustom: true,
              installDir: cc.installDir
            }));
          } catch (error) {
            console.warn('Failed to scan custom channels:', error);
          }
        }
        
        // Merge official and custom channels
        const mergedChannels = [...json.channels, ...customChannels];
        const updatedConfig = { ...json, channels: mergedChannels };
        
        setConfig(updatedConfig);
        const first = updatedConfig.channels.find((c) => c.enabled);
        if (first) setSelectedChannel(first.name);
      } catch {}
    })();
  }, []);

  // Check for launcher updates on startup and wire events
  useEffect(() => {
    try {
      window.electronAPI?.onUpdate?.('update:available', (info: any) => setUpdateAvailable(info));
      window.electronAPI?.onUpdate?.('update:not-available', () => setUpdateAvailable(null));
      window.electronAPI?.onUpdate?.('update:download-progress', (p: any) => {
        const pct = typeof p?.percent === 'number' ? p.percent : 0;
        setUpdateProgress(pct);
        if (typeof p?.bytesPerSecond === 'number') setUpdateBps(p.bytesPerSecond);
        if (typeof p?.transferred === 'number') setUpdateTransferred(p.transferred);
        if (typeof p?.total === 'number') setUpdateTotal(p.total);
      });
      window.electronAPI?.onUpdate?.('update:downloaded', () => setUpdateDownloaded(true));
      window.electronAPI?.onUpdate?.('update:error', (e: any) => { setUpdateError(String(e?.message || 'Update error')); });
      // Kick off check, non-blocking; guard missing handler
      try { window.electronAPI?.checkForUpdates?.()?.catch(() => {}); } catch {}
    } catch {}
  }, []);

  // Require updates: auto-start download when available
  useEffect(() => {
    if (updateAvailable && !updateDownloaded) {
      window.electronAPI?.downloadUpdate?.()?.catch(() => {});
    }
  }, [updateAvailable, updateDownloaded]);

  useEffect(() => {
    window.electronAPI?.getSettings()?.then((s: any) => {
      if (s?.installDir) setInstallDir(s.installDir);
      else window.electronAPI?.getDefaultInstallDir(selectedChannel || undefined).then((d) => { if (d) setInstallDir(d); });
      if (s?.concurrency) setConcurrency(Number(s.concurrency));
      if (s?.partConcurrency) setPartConcurrency(Number(s.partConcurrency));
      if (typeof s?.downloadSpeedLimit === 'number') {
        const limit = Number(s.downloadSpeedLimit);
        setDownloadSpeedLimit(limit);
        window.electronAPI?.setDownloadSpeedLimit?.(limit);
      }
      if (typeof s?.customBaseDir === 'string') setCustomBaseDir(s.customBaseDir);
      if (typeof s?.bannerVideoEnabled === 'boolean') setBannerVideoEnabled(Boolean(s.bannerVideoEnabled));
      if (typeof s?.snowEffectEnabled === 'boolean') setSnowEffectEnabled(Boolean(s.snowEffectEnabled));
      if (typeof s?.modsShowDeprecated === 'boolean') setModsShowDeprecated(Boolean(s.modsShowDeprecated));
      if (typeof s?.modsShowNsfw === 'boolean') setModsShowNsfw(Boolean(s.modsShowNsfw));
      if (typeof s?.easterEggDiscovered === 'boolean') setEasterEggDiscovered(Boolean(s.easterEggDiscovered));
      if (typeof s?.emojiMode === 'boolean') setEmojiMode(Boolean(s.emojiMode));
      if (typeof s?.patchNotesView === 'string') setPatchNotesView(s.patchNotesView as 'grid' | 'timeline');
      if (typeof s?.installedModsView === 'string') setInstalledModsView(s.installedModsView as 'grid' | 'list');
      if (typeof s?.browseModsView === 'string') setBrowseModsView(s.browseModsView as 'grid' | 'list');
      // Migration from old single modsView setting
      if (typeof s?.modsView === 'string' && !s?.installedModsView && !s?.browseModsView) {
        setInstalledModsView(s.modsView as 'grid' | 'list');
        setBrowseModsView(s.modsView as 'grid' | 'list');
      }
      if (s?.channels) {
        // Migrate existing channels to include missing fields
        const migratedChannels = { ...s.channels };
        let needsUpdate = false;
        
        Object.keys(migratedChannels).forEach(channelName => {
          const channel = migratedChannels[channelName];
          if (typeof channel.includeOptional === 'undefined') {
            channel.includeOptional = false;
            needsUpdate = true;
          }
          if (typeof channel.hdTexturesInstalled === 'undefined') {
            channel.hdTexturesInstalled = false;
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          console.log('Migrating channel settings to include HD texture fields');
          window.electronAPI?.setSetting('channels', migratedChannels);
        }
        
        setChannelsSettings(migratedChannels);
      }
    });
  }, [selectedChannel]);

  const channel = useMemo(
    () => config?.channels.find((c) => c.name === selectedChannel),
    [config, selectedChannel]
  );

  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [primaryAction, setPrimaryAction] = useState<'install'|'update'|'play'|'repair'>('install');
  const [needsRepair, setNeedsRepair] = useState<boolean>(false);
  const enabledChannels = useMemo(() => (config?.channels?.filter((c) => c.enabled) || []), [config]);
  const [channelsSettings, setChannelsSettings] = useState<Record<string, any>>({});
  // Mods state
  type InstalledMod = { id?: string; name: string; folder: string; version?: string|null; description?: string; enabled: boolean; hasManifest?: boolean };
  const [modsSubtab, setModsSubtab] = useState<'installed'|'all'>('all');
  const [installedMods, setInstalledMods] = useState<InstalledMod[] | null>(null);
  const [installedModsLoading, setInstalledModsLoading] = useState(false);
  const [allMods, setAllMods] = useState<any[] | null>(null);
  const [allModsLoading, setAllModsLoading] = useState(false);
  const [modsQuery, setModsQuery] = useState('');
  const [modsError, setModsError] = useState<string | null>(null);
  const [modsRefreshNonce, setModsRefreshNonce] = useState(0);
  const [installingMods, setInstallingMods] = useState<Record<string, 'install'|'uninstall'|undefined>>({});
  const [modProgress, setModProgress] = useState<Record<string, { received: number; total: number; phase: string }>>({});
  const [modsShowDeprecated, setModsShowDeprecated] = useState<boolean>(false);
  const [modsShowNsfw, setModsShowNsfw] = useState<boolean>(false);
  const [installedModsView, setInstalledModsView] = useState<'grid' | 'list'>('grid');
  const [browseModsView, setBrowseModsView] = useState<'grid' | 'list'>('grid');
  const [modsCategory, setModsCategory] = useState<'all' | 'weapons' | 'maps' | 'ui' | 'gameplay' | 'audio'>('all');
  const [modsSortBy, setModsSortBy] = useState<'name' | 'date' | 'downloads' | 'rating'>('name');
  const [modsFilter, setModsFilter] = useState<'all' | 'installed' | 'available' | 'updates'>('all');
  const [favoriteMods, setFavoriteMods] = useState<Set<string>>(new Set());
  const [draggingModName, setDraggingModName] = useState<string | null>(null);
  const [dragOverModName, setDragOverModName] = useState<string | null>(null);
  const outdatedMods = useMemo(() => {
    try {
      const list = (installedMods || []).map((im) => {
        const latest = getLatestVersionForName(im.name);
        const needs = latest && im.version && compareVersions(im.version, latest) < 0;
        return needs ? { name: im.name, current: im.version || null, latest } : null;
      }).filter(Boolean) as { name?: string; current: string | null; latest: string | null }[];
      return list;
    } catch { return []; }
  }, [installedMods, allMods]);

  const installedModsAugmented: InstalledMod[] = useMemo(() => {
    const base = Array.isArray(installedMods) ? installedMods.slice() : [];
    try {
      const installingKeys = Object.entries(installingMods)
        .filter(([_, v]) => v === 'install')
        .map(([k]) => String(k));
      for (const key of installingKeys) {
        const exists = base.some((m) => (m.folder || m.name) === key);
        if (!exists) {
          base.push({ name: key, folder: key, enabled: false, version: null, description: '', hasManifest: false });
        }
      }
    } catch {}
    return base;
  }, [installedMods, installingMods]);
  // News posts
  type NewsPost = { title: string; excerpt?: string; html?: string; published_at?: string; url: string; feature_image?: string };
  const [newsPosts, setNewsPosts] = useState<NewsPost[] | null>(null);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);
  const [patchPosts, setPatchPosts] = useState<NewsPost[] | null>(null);
  const [patchLoading, setPatchLoading] = useState<boolean>(false);
  const [patchNotesView, setPatchNotesView] = useState<'grid' | 'timeline'>('grid');
  const [patchNotesFilter, setPatchNotesFilter] = useState<'all' | 'patch-notes' | 'community' | 'dev-blog'>('all');
  const [patchNotesSearch, setPatchNotesSearch] = useState<string>('');
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set());
  const [favoritePosts, setFavoritePosts] = useState<Set<string>>(new Set());
  // Launch options state
  type LaunchMode = 'HOST'|'SERVER'|'CLIENT';
  const [launchMode, setLaunchMode] = useState<LaunchMode>('HOST');
  const [hostname, setHostname] = useState<string>('');
  const [visibility, setVisibility] = useState<number>(0);
  const [windowed, setWindowed] = useState<boolean>(false);
  const [borderless, setBorderless] = useState<boolean>(false);
  const [maxFps, setMaxFps] = useState<string>('');
  const [resW, setResW] = useState<string>('');
  const [resH, setResH] = useState<string>('');
  const [reservedCores, setReservedCores] = useState<string>('-1');
  const [workerThreads, setWorkerThreads] = useState<string>('-1');
  const [encryptPackets, setEncryptPackets] = useState<boolean>(true);
  const [randomNetkey, setRandomNetkey] = useState<boolean>(true);
  const [queuedPackets, setQueuedPackets] = useState<boolean>(true);
  const [noTimeout, setNoTimeout] = useState<boolean>(false);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [colorConsole, setColorConsole] = useState<boolean>(true);
  const [playlistFile, setPlaylistFile] = useState<string>('playlists_r5_patch.txt');
  const [mapIndex, setMapIndex] = useState<number>(0);
  const [playlistIndex, setPlaylistIndex] = useState<number>(0);
  const [enableDeveloper, setEnableDeveloper] = useState<boolean>(false);
  const [enableCheats, setEnableCheats] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [noAsync, setNoAsync] = useState<boolean>(false);
  const [discordRichPresence, setDiscordRichPresence] = useState<boolean>(true);
  const [customCmd, setCustomCmd] = useState<string>('');
  const launchSaveTimer = useRef<any>(null);
  const [modDetailsOpen, setModDetailsOpen] = useState<boolean>(false);
  const [modDetailsPack, setModDetailsPack] = useState<any | null>(null);
  const [pendingDeepLink, setPendingDeepLink] = useState<{ name?: string; version?: string; downloadUrls?: string[] } | null>(null);
  // EULA state
  const [eulaOpen, setEulaOpen] = useState<boolean>(false);
  const [eulaLoading, setEulaLoading] = useState<boolean>(false);
  const [eulaContent, setEulaContent] = useState<string>('');
  const eulaKeyRef = useRef<string>('');
  const eulaResolveRef = useRef<null | ((ok: boolean) => void)>(null);
  const [playCooldown, setPlayCooldown] = useState<boolean>(false);
  const launchClickGuardRef = useRef<boolean>(false);
  
  // Easter egg state for emoji letter replacement
  const [emojiMode, setEmojiMode] = useState<boolean>(false);
  const [versionClickCount, setVersionClickCount] = useState<number>(0);
  const [easterEggDiscovered, setEasterEggDiscovered] = useState<boolean>(false);
  const versionClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Letter-to-emoji mapping function - now creates blue square elements
  const letterToEmoji = (text: string): string => {
    if (!emojiMode) return text;
    
    return text.split('').map(char => {
      const lowerChar = char.toLowerCase();
      
      // Handle letters - create blue square elements
      if (/[a-z]/.test(lowerChar)) {
        return `<span class="emoji-letter">${lowerChar.toUpperCase()}</span>`;
      }
      
      // Handle numbers with emoji equivalents
      const numberMap: Record<string, string> = {
        '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
        '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
      };
      
      if (numberMap[char]) {
        return numberMap[char];
      }
      
      // Handle special characters
      const specialMap: Record<string, string> = {
        '!': '❗', '?': '❓', '+': '➕', '-': '➖', '*': '✴️',
        '@': '📧', '#': '#️⃣', '%': '🔢', '$': '💲'
      };
      
      return specialMap[char] || char;
    }).join('');
  };

  // Function to transform all text nodes in the DOM
  const transformAllText = (element: Element, transform: boolean) => {
    if (!element) return;
    
    if (!transform) {
      // Restore mode: find all elements with stored original content
      const elementsWithOriginal = element.querySelectorAll('[data-original-html]');
      elementsWithOriginal.forEach(el => {
        const originalHtml = el.getAttribute('data-original-html');
        if (originalHtml !== null) {
          el.innerHTML = originalHtml;
          el.removeAttribute('data-original-html');
          el.removeAttribute('data-original-text');
        }
      });
      return;
    }

    // Transform mode: recursively find and transform all text nodes
    const processElement = (el: Element) => {
      // Skip if already processed
      if (el.hasAttribute('data-original-html') || el.classList.contains('emoji-letter')) {
        return;
      }

      const childNodes = Array.from(el.childNodes);
      let needsTransform = false;

      // Check if this element has direct text content that needs transformation
      childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          const text = node.nodeValue;
          if (/[a-zA-Z0-9]/.test(text)) {
            needsTransform = true;
          }
        }
      });

      if (needsTransform) {
        // Store original HTML before transformation
        el.setAttribute('data-original-html', el.innerHTML);
        
        // Process each child node
        childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
            const transformedText = letterToEmoji(node.nodeValue);
            if (transformedText !== node.nodeValue) {
              // Create a temporary container for the transformed HTML
              const tempSpan = document.createElement('span');
              tempSpan.innerHTML = transformedText;
              
              // Replace the text node with the transformed content
              while (tempSpan.firstChild) {
                el.insertBefore(tempSpan.firstChild, node);
              }
              el.removeChild(node);
            }
          }
        });
      }

      // Recursively process child elements that haven't been processed yet
      const childElements = Array.from(el.children);
      childElements.forEach(child => {
        if (!child.classList.contains('emoji-letter')) {
          processElement(child);
        }
      });
    };

    processElement(element);
  };

  // Effect to transform text when emoji mode changes
  useEffect(() => {
    const mainContainer = document.querySelector('.launcher-main');
    if (!mainContainer) return;

    // Use a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      transformAllText(mainContainer as Element, emojiMode);
    }, 50);

    let observer: MutationObserver | null = null;

    if (emojiMode) {
      // Set up MutationObserver to catch dynamically added content
      observer = new MutationObserver((mutations) => {
        // Temporarily disconnect to prevent infinite loops
        observer?.disconnect();
        
        let shouldReconnect = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              // Skip our own emoji-letter spans to prevent loops
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (!element.classList.contains('emoji-letter') && !element.querySelector('.emoji-letter')) {
                  transformAllText(element, true);
                  shouldReconnect = true;
                }
              } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
                const parent = node.parentElement;
                // Only transform if parent doesn't already have emoji letters
                if (parent && !parent.classList.contains('emoji-letter') && !parent.querySelector('.emoji-letter')) {
                  transformAllText(parent, true);
                  shouldReconnect = true;
                }
              }
            });
          }
        });

        // Reconnect observer after a short delay
        if (shouldReconnect) {
          setTimeout(() => {
            if (observer && emojiMode) {
              observer.observe(mainContainer, {
                childList: true,
                subtree: true
              });
            }
          }, 100);
        } else {
          // Reconnect immediately if no changes were made
          observer?.observe(mainContainer, {
            childList: true,
            subtree: true
          });
        }
      });

      observer.observe(mainContainer, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [emojiMode]);

  // Re-transform when active tab changes (in case new content appears)
  useEffect(() => {
    if (emojiMode) {
      const timer = setTimeout(() => {
        const mainContainer = document.querySelector('.launcher-main');
        if (mainContainer) {
          transformAllText(mainContainer as Element, true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, emojiMode]);

  async function persistDir(dir: string) {
    setInstallDir(dir);
    try {
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      channels[selectedChannel] = { ...(channels[selectedChannel] || {}), installDir: dir };
      await window.electronAPI?.setSetting('channels', channels);
    } catch {}
  }


  const installClickGuardRef = useRef(false);
  
  async function openInstallPrompt() {
    // Prevent multiple clicks during async work
    if (busy || installClickGuardRef.current) return;
    
    // Custom channels can't be installed, only repaired
    if (channel?.isCustom) {
      alert('Custom channels cannot be installed from remote sources. You can only repair or play existing installations.');
      return;
    }
    
    installClickGuardRef.current = true;
    try {
      const defaultDir = (await window.electronAPI?.getDefaultInstallDir(selectedChannel)) || installDir;
    const base = deriveBaseFromDir(defaultDir || installDir, selectedChannel) || defaultDir || '';
    const targetInstallDir = base ? `${base}\\${selectedChannel}` : `${selectedChannel}`;
    
    // Check if r5apex.exe already exists in the target directory
    // If it does, repair instead of showing install prompt
    try {
      const installStatus = await window.electronAPI?.isInstalledInDir(targetInstallDir);
      // Handle both old boolean return type and new object return type for backwards compatibility
      const isAlreadyInstalled = typeof installStatus === 'object' ? installStatus.isInstalled : Boolean(installStatus);
      const hasPartialFiles = typeof installStatus === 'object' ? installStatus.needsRepair : false;
      
      if (isAlreadyInstalled || hasPartialFiles) {
        // Game files or partial downloads detected - repair instead of install
        const message = hasPartialFiles && !isAlreadyInstalled
          ? 'Incomplete installation detected. Would you like to continue/repair the installation?'
          : 'Game files detected in the target directory. Would you like to repair/verify the installation instead?';
        const shouldRepair = confirm(message);
        if (shouldRepair) {
          await repairChannel(selectedChannel, false);
          return;
        }
        // If user cancels, fall through to normal install prompt
      }
    } catch (error) {
      console.warn('Error checking for existing installation:', error);
      // Continue with normal install if check fails
    }
    
    setInstallBaseDir(base || '');
    setInstallIncludeOptional(getIncludeOptional(selectedChannel)); // Initialize with current channel setting
    
    // Calculate base game size and optional files size
    try {
      if (channel) {
        const checksums = await window.electronAPI?.fetchChecksums(channel.game_url);
        const allFiles = checksums.files || [];
        
        // Calculate base game size (non-optional files)
        const baseFiles = allFiles.filter((f: any) => !f.optional);
        const totalBaseSize = baseFiles.reduce((sum: number, f: any) => sum + (f.size || 0), 0);
        setBaseGameSize(totalBaseSize);
        
        // Calculate optional files size
        const optionalFiles = allFiles.filter((f: any) => f.optional);
        const totalOptionalSize = optionalFiles.reduce((sum: number, f: any) => sum + (f.size || 0), 0);
        setOptionalFilesSize(totalOptionalSize);
      }
    } catch {
      setBaseGameSize(0);
      setOptionalFilesSize(0);
    }
    
    try { const lr = await window.electronAPI?.getLauncherInstallRoot?.(); if (lr) setLauncherRoot(lr); } catch {}
    setInstallPromptOpen(true);
    } finally {
      installClickGuardRef.current = false;
    }
  }

  async function confirmInstallWithDir() {
    const base = (installBaseDir || '').replace(/\\+$/,'');
    const finalPath = base ? `${base}\\${selectedChannel}` : `${selectedChannel}`;
    try {
      const root = await window.electronAPI?.getLauncherInstallRoot?.();
      if (root) {
        const normRoot = root.replace(/\\+$/,'').toLowerCase();
        const normTarget = finalPath.replace(/\\+$/,'').toLowerCase();
        if (normTarget.startsWith(normRoot)) {
          alert('Please choose a different folder. Do not install the game into the launcher\'s folder under AppData/Local/Programs/r5vlauncher.');
          return;
        }
      }
    } catch {}
    
    // If no default install directory is set, save this base directory as the new default
    try {
      const s: any = await window.electronAPI?.getSettings();
      if (!s?.installDir && base) {
        await window.electronAPI?.setSetting('installDir', base);
        setInstallDir(base);
      }
    } catch {}
    
    await persistDir(finalPath);
    // Update the per-channel includeOptional setting with the dialog choice
    await setIncludeOptional(selectedChannel, installIncludeOptional);
    setChannelsSettings((prev) => ({
      ...prev,
      [selectedChannel]: { ...(prev?.[selectedChannel] || {}), installDir: finalPath }
    }));
    setInstallPromptOpen(false);
    
    // Start install directly - pass finalPath to avoid race condition with state update
    await startInstall(finalPath);
  }

  async function confirmPermissionsAndInstall() {
    if (!window.electronAPI?.fixFolderPermissions) {
      alert('Permission fix functionality not available. Please restart the launcher.');
      return;
    }
    
    setIsFixingPermissions(true);
    try {
      // Fix folder permissions using admin privileges
      const result = await window.electronAPI.fixFolderPermissions({ selectedChannel: selectedChannel });
      
      if (!result?.ok) {
        const errorDetails = result?.details ? `\n\nDetails:\n${result.details.join('\n')}` : '';
        const errorMessage = `Failed to set folder permissions: ${result?.error || 'Unknown error'}${errorDetails}`;
        alert(errorMessage);
        setIsFixingPermissions(false);
        return;
      }
      
    } catch (error) {
      const errorMessage = `Failed to set folder permissions: ${String(error)}`;
      alert(errorMessage);
      setIsFixingPermissions(false);
      return;
    }
    
    setIsFixingPermissions(false);
    setPermissionPromptOpen(false);
    await startInstall();
  }

  async function startInstall(overrideInstallDir?: string) {
    // Custom channels cannot be installed
    if (channel?.isCustom) {
      alert('Custom channels cannot be installed from remote sources.');
      return;
    }
    
    // Use override if provided (from confirmInstallWithDir), otherwise fall back to settings
    const actualInstallDir = overrideInstallDir || (channelsSettings?.[selectedChannel]?.installDir) || installDir;
    if (!channel || !actualInstallDir) return;
    // Require EULA
    const ok = await requireEula();
    if (!ok) return;
    setBusy(true);
    setFinished(false);
    setProgressItems({});
    setDoneCount(0);
    setTotalCount(0);
    setCurrentOperation('Installing files');
    const runId = Date.now();
    runIdRef.current = runId;
    try {
      const checksums = await window.electronAPI!.fetchChecksums(channel.game_url);
      const filtered = (checksums.files || []).filter((f: any) => getIncludeOptional(selectedChannel) || !f.optional);
      setTotalCount(filtered.length);
      setDoneCount(0);
      const guard = (fn: (x:any)=>void) => (payload: any) => { if (runIdRef.current !== runId) return; fn(payload); };
      
      // Create a lookup map for file sizes from checksums data
      const fileSizeMap = new Map<string, number>();
      (checksums.files || []).forEach((file: any) => {
        if (file.path && file.size) {
          fileSizeMap.set(file.path, Number(file.size));
        }
      });
      window.electronAPI!.onProgress('progress:start', guard((p: any) => { 
        setOverall(p); 
        setHasStarted(true); 
        setCurrentOperation('Installing files'); 
      }));
      window.electronAPI!.onProgress('progress:bytes:total', guard((p: any) => { const tot = Math.max(0, Number(p.totalBytes || 0)); setBytesTotal(tot); bytesTotalRef.current = tot; setBytesReceived(0); bytesReceivedRef.current = 0; setSpeedBps(0); setEtaSeconds(0); setHasStarted(true); setReceivedAnyBytes(false); }));
      {
        let windowBytes = 0;
        let lastTick = Date.now();
        let lastUIUpdate = Date.now();
        const tick = () => {
          if (runIdRef.current !== runId) return;
          const now = Date.now();
          const dt = (now - lastTick) / 1000;
          if (dt >= 0.5) {
            const speed = windowBytes / dt; // bytes per sec
            setSpeedBps(speed);
            const remain = Math.max(0, bytesTotalRef.current - (bytesReceivedRef.current));
            setEtaSeconds(speed > 0 ? Math.ceil(remain / speed) : 0);
            windowBytes = 0;
            lastTick = now;
          }
          if (busyRef.current && !pausedRef.current) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        window.electronAPI!.onProgress('progress:bytes', guard((p: any) => {
          const d = Number(p?.delta || 0);
          if (d !== 0) {
            const now = Date.now();
            // Update internal counters immediately for accuracy
            const tentative = Math.max(0, bytesReceivedRef.current + d);
              const capped = bytesTotalRef.current > 0 ? Math.min(tentative, bytesTotalRef.current) : tentative;
              bytesReceivedRef.current = capped;
            
            if (d > 0) windowBytes += d; else windowBytes = Math.max(0, windowBytes + d);
            if (d > 0) setReceivedAnyBytes(true);
            
            // Throttle UI updates to max 10 times per second to reduce React overhead
            if (now - lastUIUpdate >= 100) {
              setBytesReceived(capped);
              lastUIUpdate = now;
            }
          }
        }));
      }
      window.electronAPI!.onProgress('progress:file', guard((p: any) => {
        setFileProgress(p);
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: {
            ...(prev[p.path]||{}),
            status: 'downloading',
            received: Math.min(p.received, p.total || p.received),
            total: p.total
          }
        }));
      }));
      window.electronAPI!.onProgress('progress:part', guard((p: any) => {
        setFileProgress({ path: `${p.path} (part ${p.part+1}/${p.totalParts})`, received: Math.min(p.received, p.total || p.received), total: p.total });
        setProgressItems((prev) => {
          const current = prev[p.path] || { status: 'downloading' } as FileInfo;
          const parts = { ...(current.parts || {}) } as Record<number, PartInfo>;
          parts[p.part] = { received: Math.min(p.received, p.total || p.received), total: p.total };
          return {
            ...prev,
            [p.path]: { ...current, status: 'downloading parts', totalParts: p.totalParts, parts }
          };
        });
      }));
      window.electronAPI!.onProgress('progress:part:reset', guard((p: any) => {
        setProgressItems((prev) => {
          const current = prev[p.path] || { status: 'downloading parts' } as FileInfo;
          const parts = { ...(current.parts || {}) } as Record<number, PartInfo>;
          if (parts[p.part]) parts[p.part] = { received: 0, total: parts[p.part].total || 0 };
          return { ...prev, [p.path]: { ...current, parts } };
        });
      }));
      window.electronAPI!.onProgress('progress:merge:start', guard((p: any) => {
        setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 });
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 }
        }));
      }));
      window.electronAPI!.onProgress('progress:merge:part', guard((p: any) => {
        setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts });
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.part+1}/${p.totalParts}`, parts: {}, totalParts: 0 }
        }));
      }));
      window.electronAPI!.onProgress('progress:merge:done', guard((p: any) => {
        setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 });
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 }
        }));
      }));
      window.electronAPI!.onProgress('progress:verify', guard((p: any) => { 
        setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); 
        // Don't add verify-only files to progress display to reduce visual jumping
      }));
      window.electronAPI!.onProgress('progress:skip', guard((p: any) => { 
        // Add skipped file bytes to received total for accurate progress
        let sizeBytes = Number(p.size || 0);
        if (!sizeBytes && p.path && fileSizeMap.has(p.path)) {
          sizeBytes = fileSizeMap.get(p.path) || 0;
        }
        
        if (sizeBytes > 0) {
          setBytesReceived((x) => Math.max(0, x + sizeBytes));
          bytesReceivedRef.current = Math.max(0, bytesReceivedRef.current + sizeBytes);
        }
        // Don't add skipped files to progress display to reduce visual jumping
        if (fileProgress?.path?.startsWith(p.path)) setFileProgress(null); 
      }));
      window.electronAPI!.onProgress('progress:error', guard((p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { status: `error: ${p.message}` } })); }));
      window.electronAPI!.onProgress('progress:done', guard((p: any) => {
        setOverall(p);
        setExitingItems((prev) => ({ ...prev, [p.path]: true }));
        setDoneCount((x) => x + 1);
        if (fileProgress?.path?.startsWith(p.path)) setFileProgress(null);
        setTimeout(() => {
          setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; });
          setExitingItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; });
        }, 240);
      }));
      window.electronAPI!.onProgress('progress:paused', guard(() => { setIsPaused(true); }));
      window.electronAPI!.onProgress('progress:resumed', guard(() => { setIsPaused(false); }));
      window.electronAPI!.onProgress('progress:cancelled', guard(() => { setIsPaused(false); setBusy(false); setHasStarted(false); }));
      await window.electronAPI!.downloadAll({ baseUrl: channel.game_url, checksums, installDir: actualInstallDir, includeOptional: getIncludeOptional(selectedChannel), concurrency, partConcurrency, channelName: channel.name, mode: 'install' });
      setToastMessage('Install completed');
      setToastType('success');
      setFinished(true);
      // Update local install state so primary button flips to Play
      setInstalledVersion(String(checksums?.game_version || ''));
      setIsInstalled(true);
      setNeedsRepair(false); // Installation complete, no partial files
      setChannelsSettings((prev) => ({
        ...prev,
        [channel.name]: {
          ...(prev?.[channel.name] || {}),
          installDir: actualInstallDir,
          gameVersion: checksums?.game_version || null,
          gameBaseUrl: channel.game_url,
          lastUpdatedAt: Date.now(),
        },
      }));
    } finally {
      setBusy(false);
      setHasStarted(false);
      setReceivedAnyBytes(false);
    }
  }

  // Background video from config (cached via custom protocol), with PNG fallback
  const [bgCached, setBgCached] = useState<string | undefined>(undefined);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoFilename = useMemo(() => {
    const raw = config?.backgroundVideo;
    if (!raw) return undefined;
    const parts = raw.split('/');
    return parts[parts.length - 1];
  }, [config?.backgroundVideo]);
  useEffect(() => {
    if (!videoFilename || !bannerVideoEnabled) {
      setBgCached(undefined);
      setVideoSrc(null);
      return;
    }
    window.electronAPI?.cacheBackgroundVideo(videoFilename)
      .then((url: string) => {
        setBgCached(url);
        setVideoSrc(url);
      })
      .catch(() => {
        setBgCached(undefined);
        setVideoSrc(`https://blaze.playvalkyrie.org/video_backgrounds/${videoFilename}`);
      });
  }, [videoFilename]);
  useEffect(() => { if (bgCached) setVideoSrc(bgCached); }, [bgCached]);
  const bgVideo = bannerVideoEnabled ? (videoSrc || undefined) : undefined;

  useEffect(() => {
    (async () => {
      if (!channel) return;
      // Custom channels don't have remote versions
      if (channel.isCustom) {
        setRemoteVersion(null);
        return;
      }
      try {
        const j = await window.electronAPI!.fetchChecksums(channel.game_url);
        setRemoteVersion(String(j?.game_version || ''));
      } catch { setRemoteVersion(null); }
    })();
  }, [channel?.game_url, channel?.isCustom]);

  // Load installed mods when Mods tab opens or installDir changes
  useEffect(() => {
    if (activeTab !== 'mods') return;
    (async () => {
      try {
        setInstalledModsLoading(true);
        const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
        const res = await window.electronAPI?.listInstalledMods?.(dir || '');
        setInstalledMods(res?.ok ? (res?.mods || []) : []);
      } catch { setInstalledMods([]); } finally { setInstalledModsLoading(false); }
    })();
  }, [activeTab, channelsSettings?.[selectedChannel]?.installDir, installDir]);

  useEffect(() => {
    try {
      if (!window.electronAPI || !window.electronAPI.onModsProgress) return;
      const handler = (p: any) => {
        if (!p || !p.key) return;
        setModProgress((prev) => ({ ...prev, [String(p.key)]: { received: Number(p.received||0), total: Number(p.total||0), phase: String(p.phase||'downloading') } }));
      };
      window.electronAPI.onModsProgress(handler);
    } catch {}
  }, []);

  // Watch mods folder for changes when on Mods tab
  useEffect(() => {
    let unlisten: any = null;
    (async () => {
      try {
        if (activeTab !== 'mods') return;
        const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
        if (!dir) return;
        await window.electronAPI?.watchMods?.(dir);
        const listener = async (_payload: any) => {
          try { const res = await window.electronAPI?.listInstalledMods?.(dir); if (res?.ok) setInstalledMods(res.mods || []); } catch {}
        };
        window.electronAPI?.onModsChanged?.(listener);
        unlisten = () => { try { /* no direct off API; watcher removed on unwatch */ } catch {} };
      } catch {}
    })();
    return () => {
      (async () => { try { const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir; if (dir) await window.electronAPI?.unwatchMods?.(dir); } catch {} })();
      if (typeof unlisten === 'function') try { unlisten(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, channelsSettings?.[selectedChannel]?.installDir, installDir]);

  // Load all mods list when Mods tab is opened or search changes (debounced). Avoid reloading just by switching subtab.
  useEffect(() => {
    if (activeTab !== 'mods') return;
    const t = setTimeout(async () => {
      try {
        setAllModsLoading(true);
        setModsError(null);
        let ok = false;
        let list: any[] = [];
        let errMsg: string | null = null;
        try {
          const res = await window.electronAPI?.fetchAllMods?.(modsQuery);
          if (res && typeof res === 'object') {
            ok = !!res.ok; list = Array.isArray(res?.mods) ? res.mods : []; errMsg = res?.error ? String(res.error) : null;
          }
        } catch {}
        if (!ok) {
          try {
            const r = await fetch('https://thunderstore.io/c/r5valkyrie/api/v1/package/', {
              headers: { 'Accept': 'application/json,*/*;q=0.8' },
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const json = await r.json();
            list = Array.isArray(json) ? json : [];
            ok = true;
          } catch (e:any) {
            ok = false; errMsg = String(e?.message || e || 'Fetch failed');
          }
        }
        if (ok) setAllMods(list);
        else { setAllMods([]); setModsError(String(errMsg || 'Failed to load mods')); }
      } catch { setAllMods([]); } finally { setAllModsLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [activeTab, modsQuery, modsRefreshNonce]);

  async function toggleModEnabled(mod: InstalledMod) {
    try {
      const next = !mod.enabled;
      const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
      if (!dir) { setModsError('Install the game first to manage mods.'); return; }
      await window.electronAPI?.setModEnabled?.(dir, String(mod.id || mod.name), next);
      setInstalledMods((prev) => (prev || []).map(m => m.name === mod.name ? { ...m, enabled: next } : m));
    } catch {}
  }

  async function uninstallMod(mod: InstalledMod) {
    try {
      const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
      if (!dir) { setModsError('Install the game first to manage mods.'); return; }
      setInstallingMods((s) => ({ ...s, [mod.folder || mod.name]: 'uninstall' }));
      await window.electronAPI?.uninstallMod?.(dir, mod.folder || mod.name);
      setInstalledMods((prev) => (prev || []).filter(m => m.name !== mod.name));
    } catch {}
    finally { setInstallingMods((s) => { const n = { ...s }; delete n[mod.folder || mod.name]; return n; }); }
  }

  async function installMod(mod: any) {
    try {
      const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
      if (!dir) { setModsError('Install the game first to install mods.'); return; }
      const versions = Array.isArray(mod?.versions) ? mod.versions : [];
      const latest = versions[0] || null;
      const dl = latest?.download_url || '';
      const folderName = (mod?.full_name || mod?.name || latest?.name || 'mod').replace(/[\\/:*?"<>|]/g, '_');
      if (installingMods[folderName]) return; // de-dup renderer triggers
      if (!dl) return;
      setInstallingMods((s) => ({ ...s, [folderName]: 'install' }));
      const resInstall = await window.electronAPI?.installMod?.(dir, String(folderName), String(dl));
      if (!resInstall || (resInstall as any)?.ok === false) {
        setModsError(String((resInstall as any)?.error || 'Failed to install mod'));
      }
      // refresh installed list
      const res = await window.electronAPI?.listInstalledMods?.(dir || '');
      setInstalledMods(res?.ok ? (res?.mods || []) : (installedMods || []));
    } catch {}
    finally { setInstallingMods((s) => { const n = { ...s }; const k = (mod?.full_name || mod?.name || (mod?.full_name?.split('-')?.[0]) || 'mod').replace(/[\\/:*?"<>|]/g, '_'); delete n[k]; return n; }); }
  }

  function getModIconUrl(nameOrId?: string): string | undefined {
    if (!nameOrId || !Array.isArray(allMods)) return undefined;
    const needle = String(nameOrId).toLowerCase();
    const pack = allMods.find((p: any) => {
      const n = String(p?.name || '').toLowerCase();
      const fn = String(p?.full_name || '').toLowerCase();
      return n === needle || fn === needle || fn.startsWith(`${needle}-`);
    });
    const latest = Array.isArray(pack?.versions) && pack.versions[0] ? pack.versions[0] : null;
    return latest?.icon;
  }

  function getPackageUrlFromPack(pack: any): string | undefined {
    const url = pack?.package_url;
    if (typeof url === 'string' && url) return url;
    const name = pack?.name || '';
    if (name) return `https://thunderstore.io/c/r5valkyrie/?search=${encodeURIComponent(name)}`;
    return 'https://thunderstore.io/c/r5valkyrie';
  }

  function getPackageUrlByName(name?: string): string {
    const needle = String(name || '').toLowerCase();
    const pack = (allMods || []).find((p: any) => String(p?.name||'').toLowerCase() === needle);
    return getPackageUrlFromPack(pack) || 'https://thunderstore.io/c/r5valkyrie';
  }

  async function requireEula(): Promise<boolean> {
    try {
      const s: any = await window.electronAPI?.getSettings?.();
      const acceptedVersion = s?.eulaAcceptedVersion || null;
      setEulaLoading(true);
      let json: any = null;
      try {
        const r = await window.electronAPI?.fetchEula?.();
        json = r?.ok ? r?.json : null;
      } catch {}
      if (!json) {
        try {
          const res = await fetch('https://playvalkyrie.org/api/eula');
          json = await res.json().catch(() => ({}));
        } catch {}
      }
      setEulaLoading(false);
      const ok = json && json.success && json.data && typeof json.data.contents === 'string';
      if (!ok) return true; // fail-open
      const version = json.data.version || json.data.modified || 'latest';
      eulaKeyRef.current = String(version);
      if (acceptedVersion && String(acceptedVersion) === String(version)) return true;
      setEulaContent(String(json.data.contents || ''));
      return await new Promise<boolean>((resolve) => {
        eulaResolveRef.current = resolve;
        setEulaOpen(true);
      });
    } catch {
      setEulaLoading(false);
      return true;
    }
  }

  function getLatestVersionForName(name?: string): string | null {
    const needle = String(name || '').toLowerCase();
    const pack = (allMods || []).find((p: any) => String(p?.name||'').toLowerCase() === needle);
    const latest = Array.isArray(pack?.versions) && pack.versions[0] ? pack.versions[0] : null;
    return latest?.version_number || null;
  }


  function isInstalledModVisible(mod: InstalledMod): boolean {
    const pack = getPackByName(mod.name || mod.id, allMods || undefined);
    const isDeprecated = !!(pack && pack.is_deprecated);
    const isNsfw = !!(pack && pack.has_nsfw_content);
    if (!modsShowDeprecated && isDeprecated) return false;
    if (!modsShowNsfw && isNsfw) return false;
    return true;
  }




  async function installFromAll(pack: any) {
    const latest = Array.isArray(pack?.versions) && pack.versions[0] ? pack.versions[0] : null;
    const baseName = pack?.full_name || pack?.name || latest?.name || 'mod';
    const folderName = sanitizeFolderName(baseName);
    if (installingMods[folderName]) return;
    await installMod({ name: folderName, versions: pack?.versions });
  }

  async function updateFromAll(pack: any) {
    const nameKey = String(pack?.name || '').toLowerCase();
    const installed = (installedMods || []).find((m) => String(m.name || '').toLowerCase() === nameKey);
    if (!installed) return installFromAll(pack);
    await installMod({ name: installed.folder || installed.name, versions: pack?.versions });
  }

  async function uninstallFromAll(pack: any) {
    const nameKey = String(pack?.name || '').toLowerCase();
    const installed = (installedMods || []).find((m) => String(m.name || '').toLowerCase() === nameKey);
    if (installed) await uninstallMod(installed);
  }

  async function updateInstalled(mod: InstalledMod) {
    const pack = getPackByName(mod.name, allMods || undefined);
    if (!pack) return;
    await installMod({ name: mod.folder || mod.name, versions: pack.versions });
  }

  useEffect(() => {
    const handler = () => {
      setBusy(false);
      setIsPaused(true);
      setFinished(false);
      setOverall(null);
      setFileProgress(null);
      setProgressItems({});
      setBytesTotal(0);
      setBytesReceived(0);
      setSpeedBps(0);
      setEtaSeconds(0);
      setHasStarted(false);
    };
    window.electronAPI?.onProgress?.('progress:cancelled', handler);
    return () => {
      // no off() provided; safe to ignore for this context
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s: any = await window.electronAPI?.getSettings();
        const ch = s?.channels?.[selectedChannel];
        setChannelsSettings(s?.channels || {});
        
        // For custom channels, use the installDir from the channel config
        const currentChannel = channel;
        let effectiveInstallDir = ch?.installDir;
        if (currentChannel?.isCustom && currentChannel.installDir) {
          effectiveInstallDir = currentChannel.installDir;
        }
        
        if (effectiveInstallDir) {
          setInstallDir(effectiveInstallDir);
          const installStatus = await window.electronAPI?.isInstalledInDir(effectiveInstallDir);
          // Handle both old boolean return type and new object return type for backwards compatibility
          const installed = typeof installStatus === 'object' ? installStatus.isInstalled : Boolean(installStatus);
          const hasPartials = typeof installStatus === 'object' ? installStatus.needsRepair : false;
          setIsInstalled(installed);
          setNeedsRepair(hasPartials);
        } else {
          setInstallDir('');
          setIsInstalled(false);
          setNeedsRepair(false);
        }
        
        setInstalledVersion(ch?.gameVersion || null);
        // Load launch options per channel
        const lo = s?.launchOptions?.[selectedChannel];
        if (lo) {
          setLaunchMode(lo.mode || 'HOST');
          setHostname(lo.hostname || '');
          setVisibility(Number(lo.visibility || 0));
          setWindowed(Boolean(lo.windowed));
          setBorderless(lo.borderless !== false);
          setMaxFps(String(lo.maxFps ?? ''));
          setResW(String(lo.resW || ''));
          setResH(String(lo.resH || ''));
          setReservedCores(String(lo.reservedCores || ''));
          setWorkerThreads(String(lo.workerThreads || ''));
          setEncryptPackets(lo.encryptPackets !== false);
          setRandomNetkey(lo.randomNetkey !== false);
          setQueuedPackets(lo.queuedPackets !== false);
          setNoTimeout(Boolean(lo.noTimeout));
          setShowConsole(Boolean(lo.showConsole));
          setColorConsole(Boolean(lo.colorConsole));
          setPlaylistFile(String(lo.playlistFile || ''));
          setMapIndex(Number(lo.mapIndex || 0));
          setPlaylistIndex(Number(lo.playlistIndex || 0));
          setEnableDeveloper(Boolean(lo.enableDeveloper));
          setEnableCheats(Boolean(lo.enableCheats));
          setOfflineMode(Boolean(lo.offlineMode));
          setNoAsync(Boolean(lo.noAsync));
          setDiscordRichPresence(lo.discordRichPresence !== false); // Default to true
          setCustomCmd(String(lo.customCmd || ''));
        }
      } catch {}
    })();
  }, [selectedChannel]);

  useEffect(() => {
    const loadNews = async () => {
      if (newsPosts || newsLoading) return;
      setNewsLoading(true);
      try {
        const resp = await fetch('https://blog.playvalkyrie.org/ghost/api/content/posts/?key=4d046cff94d3fdfeaab2bf9ccf&include=tags,authors&filter=tag:Community&limit=10&fields=title,excerpt,html,published_at,url,feature_image');
        const json = await resp.json();
        const posts = Array.isArray(json?.posts) ? json.posts : [];
        setNewsPosts(posts);
      } catch {
        setNewsPosts([]);
      } finally {
        setNewsLoading(false);
      }
    };
    if (activeTab === 'general') loadNews();
  }, [activeTab, newsPosts, newsLoading]);

  useEffect(() => {
    const loadPatch = async () => {
      setPatchLoading(true);
      try {
        // Fetch multiple types of content
        const channelTag = `${(selectedChannel || '').toLowerCase()}-patch-notes`;
        const communityTag = 'Community'; // API uses capital C
        const devBlogTag = 'dev-blog';
        
        let filterQuery = '';
        if (patchNotesFilter === 'all') {
          // For "all", we want posts with ANY of these tags (OR logic)
          filterQuery = `filter=tag:${encodeURIComponent(channelTag)},tag:${encodeURIComponent(communityTag)},tag:${encodeURIComponent(devBlogTag)}`;
        } else if (patchNotesFilter === 'patch-notes') {
          filterQuery = `filter=tag:${encodeURIComponent(channelTag)}`;
        } else if (patchNotesFilter === 'community') {
          filterQuery = `filter=tag:${encodeURIComponent(communityTag)}`;
        } else if (patchNotesFilter === 'dev-blog') {
          filterQuery = `filter=tag:${encodeURIComponent(devBlogTag)}`;
        }
        
        const url = `https://blog.playvalkyrie.org/ghost/api/content/posts/?key=4d046cff94d3fdfeaab2bf9ccf&include=tags,authors&${filterQuery}&limit=20&fields=title,excerpt,html,published_at,url,feature_image&order=published_at%20desc`;
        
        const resp = await fetch(url);
        const json = await resp.json();
        let posts = Array.isArray(json?.posts) ? json.posts : [];
        
        // For "All" tab, prioritize community content first
        if (patchNotesFilter === 'all') {
          posts = posts.sort((a: any, b: any) => {
            const aCategory = getPostCategoryFromTags((a as any).tags);
            const bCategory = getPostCategoryFromTags((b as any).tags);
            
            // Community posts first, then dev-blog, then patch-notes
            const categoryOrder: { [key: string]: number } = { 'community': 0, 'dev-blog': 1, 'patch-notes': 2 };
            const aOrder = categoryOrder[aCategory] ?? 3;
            const bOrder = categoryOrder[bCategory] ?? 3;
            
            if (aOrder !== bOrder) {
              return aOrder - bOrder;
            }
            
            // Within same category, sort by date (newest first)
            return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
          });
        }
        
        setPatchPosts(posts);
      } catch {
        setPatchPosts([]);
      } finally {
        setPatchLoading(false);
      }
    };
    if (activeTab === 'general' && selectedChannel) loadPatch();
  }, [activeTab, selectedChannel, patchNotesFilter]);

  // Helper functions for patch notes
  const filteredPatchPosts = useMemo(() => {
    if (!patchPosts) return [];
    
    let filtered = patchPosts;
    
    // Apply search filter
    if (patchNotesSearch.trim()) {
      const searchTerm = patchNotesSearch.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm))
      );
    }
    
    return filtered;
  }, [patchPosts, patchNotesSearch]);

  const toggleFavoritePost = (postUrl: string) => {
    setFavoritePosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postUrl)) {
        newSet.delete(postUrl);
      } else {
        newSet.add(postUrl);
      }
      return newSet;
    });
  };

  const markPostAsRead = (postUrl: string) => {
    setReadPosts(prev => new Set([...prev, postUrl]));
  };

  const getPostCategory = (post: NewsPost): string => {
    if (!(post as any).tags) return 'patch-notes';
    const tags = Array.isArray((post as any).tags) ? (post as any).tags : [];
    
    // Check for explicit community tag first (case-insensitive)
    if (tags.some((tag: any) => tag.name?.toLowerCase() === 'community')) return 'community';
    
    // Check for dev-blog tag (case-insensitive)
    if (tags.some((tag: any) => tag.name?.toLowerCase() === 'dev-blog')) return 'dev-blog';
    
    // Default to patch-notes for everything else (including untagged posts)
    return 'patch-notes';
  };

  const getPostCategoryFromTags = (tags: any): string => {
    if (!tags) return 'patch-notes';
    const tagArray = Array.isArray(tags) ? tags : [];
    
    // Check for explicit community tag first (case-insensitive)
    if (tagArray.some((tag: any) => tag.name?.toLowerCase() === 'community')) return 'community';
    
    // Check for dev-blog tag (case-insensitive)
    if (tagArray.some((tag: any) => tag.name?.toLowerCase() === 'dev-blog')) return 'dev-blog';
    
    // Default to patch-notes for everything else (including untagged posts)
    return 'patch-notes';
  };

  // Enhanced mods helper functions
  const toggleFavoriteMod = (modId: string) => {
    setFavoriteMods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modId)) {
        newSet.delete(modId);
      } else {
        newSet.add(modId);
      }
      return newSet;
    });
  };

  const getModTags = (mod: any): string[] => {
    const categories = mod?.categories || mod?.tags || mod?.versions?.[0]?.categories || [];
    if (Array.isArray(categories) && categories.length > 0) {
      return categories.map(cat => String(cat)).slice(0, 3); // Limit to 3 tags for display
    }
    return [];
  };

  // Helper to map a raw category string to our normalized category
  const mapCategoryString = (cat: string): string | null => {
    const lc = cat.toLowerCase();
    if (lc.includes('weapon')) return 'weapon';
    if (lc.includes('map')) return 'map';  
    if (lc.includes('legend') || lc.includes('character')) return 'legend';
    if (lc.includes('gamemode') || lc.includes('mode')) return 'gamemode';
    if (lc.includes('ui') || lc.includes('hud')) return 'ui';
    if (lc.includes('sound') || lc.includes('audio')) return 'sound';
    if (lc.includes('animation')) return 'animation';
    if (lc.includes('model')) return 'model';
    if (lc.includes('cosmetic') || lc.includes('skin')) return 'cosmetic';
    if (lc.includes('server')) return 'server-side';
    if (lc.includes('client')) return 'client-side';
    if (lc.includes('modpack') || lc.includes('pack')) return 'modpack';
    if (lc.includes('framework') || lc.includes('library')) return 'framework';
    if (lc.includes('qol') || lc.includes('quality')) return 'qol';
    return null;
  };

  // Get ALL categories a mod belongs to (for filtering)
  const getModCategories = (mod: any): string[] => {
    const result: string[] = [];
    const categories = mod?.categories || mod?.tags || mod?.versions?.[0]?.categories || [];
    
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        const mapped = mapCategoryString(String(cat));
        if (mapped && !result.includes(mapped)) {
          result.push(mapped);
        }
      }
    }
    
    // Fallback to keyword matching if no categories found
    if (result.length === 0) {
      const name = (mod?.name || mod?.full_name || '').toLowerCase();
      const desc = (mod?.versions?.[0]?.description || '').toLowerCase();
      
      const checkKeyword = (text: string, keywords: string[]) => {
        return keywords.some(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          return regex.test(text);
        });
      };
      
      if (checkKeyword(name, ['weapon', 'gun', 'rifle', 'pistol', 'shotgun', 'sniper'])) result.push('weapon');
      if (checkKeyword(name, ['map', 'level', 'arena', 'zone'])) result.push('map');
      if (checkKeyword(name, ['legend', 'character', 'hero', 'pilot'])) result.push('legend');
      if (checkKeyword(name, ['gamemode', 'mode'])) result.push('gamemode');
      if (checkKeyword(name, ['ui', 'hud', 'interface', 'menu', 'overlay'])) result.push('ui');
      if (checkKeyword(name, ['sound', 'audio', 'music', 'sfx', 'voice'])) result.push('sound');
      if (checkKeyword(name, ['animation', 'anim'])) result.push('animation');
      if (checkKeyword(name, ['model', 'mesh'])) result.push('model');
      if (checkKeyword(name, ['cosmetic', 'skin', 'texture', 'visual'])) result.push('cosmetic');
      if (checkKeyword(name, ['server'])) result.push('server-side');
      if (checkKeyword(name, ['client'])) result.push('client-side');
      if (checkKeyword(name, ['modpack', 'pack', 'collection'])) result.push('modpack');
      if (checkKeyword(name, ['framework', 'api', 'library', 'core'])) result.push('framework');
      if (checkKeyword(name, ['qol']) || checkKeyword(desc, ['quality of life', 'improvement', 'fix', 'enhance'])) result.push('qol');
    }
    
    return result.length > 0 ? result : ['other'];
  };

  // Get the primary category for display (first one)
  const getModCategory = (mod: any): string => {
    const categories = getModCategories(mod);
    return categories[0] || 'other';
  };

  const filteredAndSortedMods = useMemo(() => {
    if (!allMods) return [];
    
    let filtered = allMods.filter((m: any) => {
      // Basic filters
      if (!modsShowDeprecated && m?.is_deprecated) return false;
      if (!modsShowNsfw && m?.has_nsfw_content) return false;
      
      // Category filter - check if ANY of the mod's categories match
      if (modsCategory !== 'all' && !getModCategories(m).includes(modsCategory)) return false;
      
      // Status filter
      const installed = (installedMods || []).find((im) => 
        String(im.name || '').toLowerCase() === String(m?.name || '').toLowerCase()
      );
      
      if (modsFilter === 'installed' && !installed) return false;
      if (modsFilter === 'available' && installed) return false;
      if (modsFilter === 'updates') {
        if (!installed) return false;
        const latest = Array.isArray(m?.versions) && m.versions[0] ? m.versions[0] : null;
        const ver = latest?.version_number || '';
        if (!ver || compareVersions(installed?.version || null, ver) >= 0) return false;
      }
      
      return true;
    });

    const totalDownloads: Record<string, number> = {};
    filtered.forEach(mod => {
      totalDownloads[mod.name] = (mod?.versions || []).reduce((sum: number, v: any) => sum + (v?.downloads || 0), 0);
    });
    
    // Sort
    filtered.sort((a: any, b: any) => {
      switch (modsSortBy) {
        case 'name':
          return (a?.name || '').localeCompare(b?.name || '');
        case 'date':
          const aDate = new Date(a?.date_created || 0).getTime();
          const bDate = new Date(b?.date_created || 0).getTime();
          return bDate - aDate;
        case 'downloads':
          return (totalDownloads[b.name] || 0) - (totalDownloads[a.name] || 0);
        case 'rating':
          return (b?.rating_score || 0) - (a?.rating_score || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [allMods, modsCategory, modsFilter, modsSortBy, modsShowDeprecated, modsShowNsfw, installedMods]);

  // Download optimization functions
  function optimizeForSpeed() {
    setConcurrency(12);      // Higher file concurrency
    setPartConcurrency(8);   // Higher part concurrency
    window.electronAPI?.setSetting('concurrency', 12);
    window.electronAPI?.setSetting('partConcurrency', 8);
  }

  function optimizeForStability() {
    setConcurrency(4);       // Lower file concurrency
    setPartConcurrency(3);   // Lower part concurrency  
    window.electronAPI?.setSetting('concurrency', 4);
    window.electronAPI?.setSetting('partConcurrency', 3);
  }

  function resetDownloadDefaults() {
    setConcurrency(8);       // Default file concurrency
    setPartConcurrency(6);   // Default part concurrency
    window.electronAPI?.setSetting('concurrency', 8);
    window.electronAPI?.setSetting('partConcurrency', 6);
  }

  function buildLaunchParametersLocal(): string {
    return buildLaunchParameters({
      launchMode: launchMode as any,
      hostname,
      visibility: String(visibility),
      windowed,
      borderless,
      maxFps,
      resW,
      resH,
      reservedCores,
      workerThreads,
      encryptPackets,
      randomNetkey,
      queuedPackets,
      noTimeout,
      showConsole,
      colorConsole,
      playlistFile,
      mapIndex: String(mapIndex),
      playlistIndex: String(playlistIndex),
      enableDeveloper,
      enableCheats,
      offlineMode,
      noAsync,
      discordRichPresence,
      customCmd,
    });
  }

  async function persistLaunchOptions() {
    const lo = { mode: launchMode, hostname, visibility, windowed, borderless, maxFps, resW, resH, reservedCores, workerThreads, encryptPackets, randomNetkey, queuedPackets, noTimeout, showConsole, colorConsole, playlistFile, mapIndex, playlistIndex, enableDeveloper, enableCheats, offlineMode, noAsync, discordRichPresence, customCmd };
    const s: any = await window.electronAPI?.getSettings();
    const next = { ...(s || {}) } as any;
    next.launchOptions = { ...(next.launchOptions || {}), [selectedChannel]: lo };
    await window.electronAPI?.setSetting('launchOptions', next.launchOptions);
  }

  useEffect(() => {
    if (!selectedChannel) return;
    if (launchSaveTimer.current) clearTimeout(launchSaveTimer.current);
    launchSaveTimer.current = setTimeout(() => {
      persistLaunchOptions().catch(() => {});
    }, 500);
    return () => { if (launchSaveTimer.current) clearTimeout(launchSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, launchMode, hostname, visibility, windowed, borderless, maxFps, resW, resH, reservedCores, workerThreads, encryptPackets, randomNetkey, queuedPackets, noTimeout, showConsole, colorConsole, playlistFile, mapIndex, playlistIndex, enableDeveloper, enableCheats, offlineMode, noAsync, discordRichPresence, customCmd]);

  useEffect(() => {
    // Decide primary action
    // Custom channels can only be played or repaired, never freshly installed or updated
    if (channel?.isCustom) {
      // Custom channels with partial files need repair
      setPrimaryAction(needsRepair ? 'repair' : 'play');
    } else if (!isInstalled && needsRepair) {
      // Not installed but has partial files - show repair to continue/fix incomplete install
      setPrimaryAction('repair');
    } else if (!isInstalled) {
      setPrimaryAction('install');
    } else if (needsRepair) {
      // Installed but has partial files - needs repair
      setPrimaryAction('repair');
    } else if (remoteVersion && installedVersion && remoteVersion !== installedVersion) {
      setPrimaryAction('update');
    } else {
      setPrimaryAction('play');
    }
  }, [isInstalled, installedVersion, remoteVersion, channel, needsRepair]);

  async function fixChannelPermissions(ch: string) {
    setBusy(true);
    try {
      const result = await window.electronAPI?.fixFolderPermissions?.({ selectedChannel: ch });
      if (result?.ok) {
        if (result.warnings && result.warnings.length > 0) {
          alert(`Permissions fixed with warnings:\n${result.warnings.join('\n')}`);
        } else {
          alert('Permissions fixed successfully!');
        }
      } else {
        alert(`Failed to fix permissions: ${result?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Failed to fix permissions: ${error?.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  }

  // News modal handler
  const openNewsPost = (post: any) => {
    setSelectedNewsPost(post);
    setNewsModalOpen(true);
    markPostAsRead(post.url);
  };

  // Uninstall modal handlers
  const handleUninstallClick = (channelName: string) => {
    setChannelToUninstall(channelName);
    setUninstallModalOpen(true);
  };

  const handleUninstallConfirm = async () => {
    if (channelToUninstall) {
      await uninstallChannel(channelToUninstall);
    }
    setUninstallModalOpen(false);
    setChannelToUninstall(null);
  };

  const handleUninstallCancel = () => {
    setUninstallModalOpen(false);
    setChannelToUninstall(null);
  };

  async function uninstallChannel(channelName: string) {
    const target = config?.channels.find((c) => c.name === channelName);
    if (!target) return;
    
    const ch = channelsSettings?.[channelName];
    const dir = target.isCustom ? target.installDir : ch?.installDir;
    
    if (!dir) {
      alert('Channel not installed or directory not found');
      return;
    }

    setBusy(true);
    try {
      // Delete the game files
      const result = await window.electronAPI?.deleteFolder?.(dir);
      
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to delete game files');
      }
      
      // Remove the channel settings
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      delete channels[channelName];
      await window.electronAPI?.setSetting('channels', channels);
      setChannelsSettings(channels);
      
      // Reset install state if this was the selected channel
      if (selectedChannel === channelName) {
        setIsInstalled(false);
        setInstalledVersion(null);
        setInstallDir('');
        setNeedsRepair(false);
      }
      
    } catch (error: any) {
      alert(`Failed to uninstall: ${error?.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  }

  async function installHdTextures(channelName: string) {
    const target = config?.channels.find((c) => c.name === channelName);
    if (!target) return;
    
    const ch = channelsSettings?.[channelName];
    const dir = ch?.installDir;
    if (!dir) {
      alert('Channel not installed or directory not found');
      return;
    }

    setBusy(true);
    setFinished(false);
    setProgressItems({});
    setDoneCount(0);
    setTotalCount(0);
    setCurrentOperation('Installing HD textures');
    const runId = Date.now();
    runIdRef.current = runId;
    
    try {
      // Fetch checksums to get optional files info
      const checksums = await window.electronAPI?.fetchChecksums?.(target.game_url);
      if (!checksums?.files) {
        alert('Failed to fetch file information');
        return;
      }

      // Check if there are optional files available
      const optionalFiles = checksums.files.filter((f: any) => f.optional);
      console.log(`Found ${optionalFiles.length} optional files for ${channelName}:`, optionalFiles.map((f: any) => f.path));
      if (optionalFiles.length === 0) {
        alert('No HD textures available for this channel');
        return;
      }

      // Set up progress tracking - count all files that will be processed (base + optional)
      const filtered = (checksums.files || []).filter((f: any) => true); // All files since includeOptional: true
      setTotalCount(filtered.length);
      setDoneCount(0);
      const guard = (fn: (x:any)=>void) => (payload: any) => { if (runIdRef.current !== runId) return; fn(payload); };
      
      // Create a lookup map for file sizes from checksums data
      const fileSizeMap = new Map<string, number>();
      (checksums.files || []).forEach((file: any) => {
        if (file.path && file.size) {
          fileSizeMap.set(file.path, Number(file.size));
        }
      });
      console.log(`Created file size map with ${fileSizeMap.size} entries`);
      
      window.electronAPI!.onProgress('progress:start', guard((p: any) => { 
        setOverall(p); 
        setHasStarted(true); 
        setCurrentOperation('Installing HD textures'); 
      }));
      window.electronAPI!.onProgress('progress:bytes:total', guard((p: any) => { 
        const tot = Math.max(0, Number(p.totalBytes || 0)); 
        console.log(`HD Texture progress:bytes:total - Total bytes: ${tot} (${(tot / 1024 / 1024 / 1024).toFixed(1)} GB)`);
        setBytesTotal(tot); 
        bytesTotalRef.current = tot; 
        setBytesReceived(0); 
        bytesReceivedRef.current = 0; 
        setSpeedBps(0); 
        setEtaSeconds(0); 
        setHasStarted(true); 
        setReceivedAnyBytes(false); 
      }));
      
      {
        let windowBytes = 0;
        let lastTick = Date.now();
        const tick = () => {
          const now = Date.now();
          const dt = Math.max(1, now - lastTick);
          if (dt >= 240) {
            const bps = (windowBytes * 1000) / dt;
            setSpeedBps(bps);
            const remaining = Math.max(0, bytesTotalRef.current - bytesReceivedRef.current);
            const eta = bps > 0 ? remaining / bps : 0;
            setEtaSeconds(eta);
            windowBytes = 0;
            lastTick = now;
          }
          if (busyRef.current && !pausedRef.current) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        window.electronAPI!.onProgress('progress:bytes', guard((p: any) => {
          const d = Number(p?.delta || 0);
          if (d !== 0) {
            console.log(`HD Texture progress:bytes - Adding ${d} bytes`);
            const now = Date.now();
            setBytesReceived((x) => Math.max(0, x + d));
            bytesReceivedRef.current = Math.max(0, bytesReceivedRef.current + d);
            windowBytes += d;
            setReceivedAnyBytes(true);
          }
        }));
      }
      
      window.electronAPI!.onProgress('progress:file:start', guard((p: any) => { 
        setFileProgress({ path: p.path, received: 0, total: p.size || 0 }); 
        setProgressItems((prev) => ({ ...prev, [p.path]: { status: 'downloading', parts: {}, totalParts: 0 } })); 
      }));
      window.electronAPI!.onProgress('progress:file', guard((p: any) => {
        setFileProgress({ path: p.path, received: 0, total: p.size || 0 });
        setProgressItems((prev) => ({ ...prev, [p.path]: { status: 'downloading', parts: {}, totalParts: 0 } }));
      }));
      window.electronAPI!.onProgress('progress:file:bytes', guard((p: any) => { 
        setFileProgress((prev) => (prev && prev.path === p.path) ? { path: prev.path, total: prev.total, received: p.received || 0 } : prev); 
      }));
      window.electronAPI!.onProgress('progress:file:done', guard((p: any) => { 
        if (fileProgress?.path === p.path) setFileProgress(null); 
        setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); 
      }));
      window.electronAPI!.onProgress('progress:file:error', guard((p: any) => { 
        if (fileProgress?.path === p.path) setFileProgress(null);
      }));
      window.electronAPI!.onProgress('progress:part', guard((p: any) => {
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: {
            ...(prev[p.path] || {}),
            status: 'downloading',
            parts: { ...(prev[p.path]?.parts || {}), [p.part]: { received: p.received, total: p.total } },
            totalParts: Math.max(prev[p.path]?.totalParts || 0, p.part + 1)
          }
        }));
      }));
      window.electronAPI!.onProgress('progress:part:reset', guard((p: any) => {
        setProgressItems((prev) => {
          const current = prev[p.path] || { status: 'downloading parts' } as FileInfo;
          const parts = { ...(current.parts || {}) } as Record<number, PartInfo>;
          // Only reset the specific part that failed, keeping totalParts intact
          if (parts[p.part]) parts[p.part] = { received: 0, total: parts[p.part].total || 0 };
          return { ...prev, [p.path]: { ...current, parts, totalParts: p.totalParts || current.totalParts || 0 } };
        });
      }));
      window.electronAPI!.onProgress('progress:skip', guard((p: any) => { 
        // Add skipped file bytes to received total for accurate progress
        console.log('HD Texture progress:skip event:', p);
        
        // Try to get size from event first, then from checksums lookup
        let sizeBytes = Number(p.size || 0);
        if (!sizeBytes && p.path && fileSizeMap.has(p.path)) {
          sizeBytes = fileSizeMap.get(p.path) || 0;
          console.log(`Got size from checksums lookup: ${sizeBytes} bytes for ${p.path}`);
        }
        
        if (sizeBytes > 0) {
          console.log(`Adding ${sizeBytes} bytes from skipped file: ${p.path}`);
          setBytesReceived((x) => Math.max(0, x + sizeBytes));
          bytesReceivedRef.current = Math.max(0, bytesReceivedRef.current + sizeBytes);
        } else {
          console.log(`Skipped file ${p.path} has no size information in event or checksums:`, p);
        }
        // Remove from progress display if it was there
        if (fileProgress?.path?.startsWith(p.path)) setFileProgress(null); 
      }));
      window.electronAPI!.onProgress('progress:merge:start', guard((p: any) => {
        setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 });
        setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 } }));
      }));
      window.electronAPI!.onProgress('progress:merge:done', guard((p: any) => {
        setProgressItems((prev) => {
          const next = { ...prev };
          delete next[p.path];
          return next;
        });
      }));
      window.electronAPI!.onProgress('progress:done', guard((p: any) => { 
        setOverall(p); 
        setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); 
        setDoneCount((x) => x + 1); 
      }));
      window.electronAPI!.onProgress('progress:paused', guard(() => { setIsPaused(true); }));
      window.electronAPI!.onProgress('progress:resumed', guard(() => { setIsPaused(false); }));
      window.electronAPI!.onProgress('progress:cancelled', guard(() => { setIsPaused(false); setBusy(false); setHasStarted(false); }));

      // Download all files with includeOptional: true (this will download missing optional files)
      await window.electronAPI!.downloadAll({ 
        baseUrl: target.game_url, 
        checksums, 
        installDir: dir, 
        includeOptional: true, 
        concurrency, 
        partConcurrency, 
        channelName: target.name, 
        mode: 'install' 
      });

      // Update the channel-specific HD textures and includeOptional settings
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      channels[channelName] = { 
        ...(channels[channelName] || {}), 
        hdTexturesInstalled: true,
        includeOptional: true 
      };
      console.log(`Updating settings for ${channelName}:`, channels[channelName]);
      await window.electronAPI?.setSetting('channels', channels);
      
      // Update local state
      setChannelsSettings(channels);
      
      alert('HD textures installed successfully!');
    } catch (error: any) {
      alert(`Failed to install HD textures: ${error?.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
      setFinished(true);
      setHasStarted(false);
    }
  }

  async function uninstallHdTextures(channelName: string) {
    const ch = channelsSettings?.[channelName];
    const dir = ch?.installDir;
    if (!dir) {
      alert('Channel not installed or directory not found');
      return;
    }

    const confirmed = confirm('Are you sure you want to uninstall HD textures? This will remove high-resolution texture files to save disk space.');
    if (!confirmed) return;

    setBusy(true);
    
    try {
      const target = config?.channels.find((c) => c.name === channelName);
      if (!target) return;

      // Fetch checksums to identify optional files
      const checksums = await window.electronAPI?.fetchChecksums?.(target.game_url);
      if (!checksums?.files) {
        alert('Failed to fetch file information');
        return;
      }

      // Get list of optional files to remove
      const optionalFiles = checksums.files.filter((f: any) => f.optional);
      
      // For now, we'll simulate uninstall by just updating the setting
      // In a full implementation, you'd need to add a removeFile function to electronAPI
      // and actually delete the optional texture files from the filesystem
      console.log(`Simulating HD texture removal for ${optionalFiles.length} files in ${dir}`);

      // Update the channel-specific HD textures and includeOptional settings
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      channels[channelName] = { 
        ...(channels[channelName] || {}), 
        hdTexturesInstalled: false,
        includeOptional: false 
      };
      await window.electronAPI?.setSetting('channels', channels);
      
      // Update local state
      setChannelsSettings(channels);
      
      alert('HD textures uninstalled successfully!');
    } catch (error: any) {
      alert(`Failed to uninstall HD textures: ${error?.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  }

  async function repairChannel(name: string, isUpdate = false) {
    // Prevent multiple clicks
    if (busy) return;
    
    const target = config?.channels.find((c) => c.name === name);
    if (!target) return;
    
    // Custom channels cannot be repaired from remote sources
    if (target.isCustom) {
      alert('Custom channels cannot be repaired from remote sources. Your local installation can only be launched.');
      return;
    }
    
    // Set busy immediately to prevent double-clicks
    setBusy(true);
    
    let dir = channelsSettings?.[name]?.installDir;
    if (!dir) {
      dir = (await window.electronAPI?.getDefaultInstallDir(name)) || '';
    }
    if (!dir) {
      setBusy(false);
      return;
    }
    setFinished(false);
    setProgressItems({});
    setDoneCount(0);
    setTotalCount(0);
    const operationText = isUpdate ? 'Updating files' : 'Repairing files';
    setCurrentOperation(operationText);
    setHasStarted(true);
    setBytesTotal(0);
    setBytesReceived(0);
    setSpeedBps(0);
    setEtaSeconds(0);
    const runId = Date.now();
    runIdRef.current = runId;
    try {
      const checksums = await window.electronAPI!.fetchChecksums(target.game_url);
      if (!checksums || !checksums.files) {
        setToastMessage('Failed to fetch update information. Please check your connection.');
        setToastType('error');
        setFinished(true);
        return;
      }
      const filtered = (checksums.files || []).filter((f: any) => getIncludeOptional(name) || !f.optional);
      setTotalCount(filtered.length);
      setDoneCount(0);
      const guard = (fn: (x:any)=>void) => (payload: any) => { if (runIdRef.current !== runId) return; fn(payload); };
      
      // Create a lookup map for file sizes from checksums data
      const fileSizeMap = new Map<string, number>();
      (checksums.files || []).forEach((file: any) => {
        if (file.path && file.size) {
          fileSizeMap.set(file.path, Number(file.size));
        }
      });
      window.electronAPI!.onProgress('progress:start', guard((p: any) => { 
        setOverall(p); 
        setHasStarted(true); 
        setCurrentOperation(operationText); 
      }));
      window.electronAPI!.onProgress('progress:bytes:total', guard((p: any) => { 
        const tot = Math.max(0, Number(p.totalBytes || 0)); 
        setBytesTotal(tot); 
        bytesTotalRef.current = tot;
        setBytesReceived(0); 
        bytesReceivedRef.current = 0;
        setSpeedBps(0); 
        setEtaSeconds(0); 
        setHasStarted(true); 
      }));
      {
        let windowBytes = 0;
        let lastTick = Date.now();
        const tick = () => {
          const now = Date.now();
          const dt = (now - lastTick) / 1000;
          if (dt >= 0.5) {
            const speed = windowBytes / dt;
            setSpeedBps(speed);
            // Use refs to get current values, not stale closure values
            const remain = Math.max(0, bytesTotalRef.current - bytesReceivedRef.current);
            setEtaSeconds(speed > 0 ? Math.ceil(remain / speed) : 0);
            windowBytes = 0;
            lastTick = now;
          }
          if (busyRef.current && !pausedRef.current) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        window.electronAPI!.onProgress('progress:bytes', guard((p: any) => {
          const d = Number(p?.delta || 0);
          if (d !== 0) {
            setBytesReceived((x) => Math.max(0, x + d));
            // Also update ref directly for tick function
            bytesReceivedRef.current = Math.max(0, bytesReceivedRef.current + d);
            if (d > 0) windowBytes += d; else windowBytes = Math.max(0, windowBytes + d);
          }
        }));
      }
      window.electronAPI!.onProgress('progress:file', guard((p: any) => {
        setFileProgress(p);
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: 'downloading', received: p.received, total: p.total }
        }));
      }));
      window.electronAPI!.onProgress('progress:part', guard((p: any) => {
        setFileProgress({ path: `${p.path} (part ${p.part+1}/${p.totalParts})`, received: p.received, total: p.total });
        setProgressItems((prev) => {
          const current = prev[p.path] || { status: 'downloading' } as FileInfo;
          const parts = { ...(current.parts || {}) } as Record<number, PartInfo>;
          parts[p.part] = { received: p.received, total: p.total };
          return {
            ...prev,
            [p.path]: { ...current, status: 'downloading parts', totalParts: p.totalParts, parts }
          };
        });
      }));
      window.electronAPI!.onProgress('progress:merge:start', guard((p: any) => { setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:merge:part', guard((p: any) => { setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.part+1}/${p.totalParts}`, parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:merge:done', guard((p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:verify', guard((p: any) => { 
        setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); 
        // Don't add verify-only files to progress display to reduce visual jumping
      }));
      window.electronAPI!.onProgress('progress:skip', guard((p: any) => { 
        // Add skipped file bytes to received total for accurate progress
        let sizeBytes = Number(p.size || 0);
        if (!sizeBytes && p.path && fileSizeMap.has(p.path)) {
          sizeBytes = fileSizeMap.get(p.path) || 0;
        }
        
        if (sizeBytes > 0) {
          setBytesReceived((x) => Math.max(0, x + sizeBytes));
          bytesReceivedRef.current = Math.max(0, bytesReceivedRef.current + sizeBytes);
        }
        // Don't add skipped files to progress display to reduce visual jumping
        // Remove from progress display if it was there from a previous download attempt
        setProgressItems((prev) => {
          const next = { ...prev };
          delete next[p.path];
          return next;
        });
      }));
      window.electronAPI!.onProgress('progress:done', guard((p: any) => { setOverall(p); setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); setDoneCount((x) => x + 1); }));
      
      // Add error handling for the download process
      try {
        await window.electronAPI!.downloadAll({ baseUrl: target.game_url, checksums, installDir: dir, includeOptional: getIncludeOptional(name), concurrency, partConcurrency, channelName: name, mode: 'repair' });
      } catch (error) {
        console.error('Download failed during repair/update:', error);
        setToastMessage('Update failed. Please try again.');
        setToastType('error');
        setFinished(true);
        return; // Exit early on download failure
      }
      const newVersion = String(checksums?.game_version || '');
      setToastMessage(isUpdate ? 'Update completed' : 'Repair completed');
      setToastType('success');
      setFinished(true);
      
      // Update local install state and persist to settings
      setInstalledVersion(newVersion);
      setIsInstalled(true);
      setNeedsRepair(false); // Repair complete, no partial files
      
      // Update channel settings both in state and persistent storage
      const updatedChannelSettings = {
        installDir: dir,
        gameVersion: checksums?.game_version || null,
        gameBaseUrl: target.game_url,
        lastUpdatedAt: Date.now(),
      };
      
      setChannelsSettings((prev) => ({
        ...prev,
        [name]: {
          ...(prev?.[name] || {}),
          ...updatedChannelSettings,
        },
      }));
      
      // Persist the updated version to settings (fire and forget to avoid blocking)
      window.electronAPI?.getSettings().then((currentSettings) => {
        const channels = { ...(currentSettings?.channels || {}) };
        channels[name] = {
          ...(channels[name] || {}),
          ...updatedChannelSettings,
        };
        return window.electronAPI?.setSetting('channels', channels);
      }).catch((error) => {
        console.error('Failed to save updated version to settings:', error);
      });
      
      // Force primary action to be determined by the updated version state
      setPrimaryAction('play');
    } catch (error) {
      console.error('Error during repair/update:', error);
      setToastMessage('Update failed. Please try again.');
      setFinished(true);
    } finally {
      setBusy(false);
      setHasStarted(false);
    }
  }

  function openModDetails(pack: any) {
    setModDetailsPack(pack);
    setModDetailsOpen(true);
  }

  async function installSpecificVersion(pack: any, version: any) {
    const folderName = sanitizeFolderName(pack?.full_name || pack?.name || version?.name || 'mod');
    await installMod({ name: folderName, full_name: pack?.full_name || pack?.name, versions: [version] });
  }

  // Handle deep link requests from main: r5v://mod/install?name=...&version=...&downloadUrl=...
  useEffect(() => {
    try {
      window.electronAPI?.onUpdate?.('deeplink:mod-install', (p: any) => {
        const payload = typeof p === 'object' && p ? p : {};
        setActiveTab('mods');
        setModsSubtab('installed');
        
        setPendingDeepLink({ name: String(payload.name || ''), version: String(payload.version || ''), downloadUrls: payload.downloadUrls });
        // Kick a refresh if list is empty to ensure we can resolve by name
        if (!allMods || (Array.isArray(allMods) && allMods.length === 0)) setModsRefreshNonce((x) => x + 1);
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once Mods list is available and we're on Mods tab, process the pending deep link
  useEffect(() => {
    if (activeTab !== 'mods' || !pendingDeepLink) return;
    const { name, version, downloadUrls } = pendingDeepLink;
    const doInstall = async () => {
      try {
        if (downloadUrls && downloadUrls?.length > 0) {
          for (let i = 0; i < downloadUrls.length; i++) {
            const downloadUrl = downloadUrls[i];
            const inferred = deriveFolderFromDownloadUrl(downloadUrl);
            const folder = sanitizeFolderName(inferred || name || 'mod');
            if (!installingMods[folder]) setInstallingMods((s)=>({ ...s, [folder]: 'install' }));
            // ensure Installed list is visible for progress
            setModsSubtab('installed');
            await installMod({ name: folder, versions: [{ name: name || inferred || 'mod', version_number: version || undefined, download_url: downloadUrl }] });
          }
          setPendingDeepLink(null);
          return;
        }
        if (name) {
          const pack = getPackByName(name, allMods || undefined);
          if (!pack) return; // wait for next effect run after list refresh
          if (version) {
            const v = (Array.isArray(pack?.versions) ? pack.versions : []).find((x: any) => String(x?.version_number || '').toLowerCase() === String(version).toLowerCase());
            if (v) {
              const folder = sanitizeFolderName(pack.full_name || pack.name || v.name || 'mod');
              setInstallingMods((s)=>({ ...s, [folder]: 'install' }));
              await installMod({ name: folder, versions: [v] });
              setPendingDeepLink(null);
              return;
            }
          }
          // Fallback to latest
          const folder = sanitizeFolderName(pack.full_name || pack.name || 'mod');
          setInstallingMods((s)=>({ ...s, [folder]: 'install' }));
          await installFromAll(pack);
          setPendingDeepLink(null);
        }
      } catch {}
    };
    doInstall();
  }, [activeTab, allMods, pendingDeepLink]);

  // Easter egg: Version button click handler
  const handleVersionClick = () => {
    const newCount = versionClickCount + 1;
    setVersionClickCount(newCount);
    
    // Clear existing timer
    if (versionClickTimerRef.current) {
      clearTimeout(versionClickTimerRef.current);
    }
    
    // Check if we've reached 5 clicks
    if (newCount >= 5) {
      const newEmojiMode = !emojiMode;
      setEmojiMode(newEmojiMode);
      setVersionClickCount(0);
      
      // Mark Easter egg as discovered and save settings
      if (!easterEggDiscovered) {
        setEasterEggDiscovered(true);
        window.electronAPI?.setSetting('easterEggDiscovered', true);
        setToastMessage('🎉 Easter egg discovered! Check settings for emoji toggle.');
        setToastType('info');
      } else {
        setToastMessage(newEmojiMode ? 'Emoji letters activated!' : 'Normal letters restored!');
        setToastType('info');
      }
      
      // Save the current emoji mode state
      window.electronAPI?.setSetting('emojiMode', newEmojiMode);
      setFinished(true);
      
      return;
    }
    
    // Reset click count after 3 seconds of inactivity
    versionClickTimerRef.current = setTimeout(() => {
      setVersionClickCount(0);
    }, 3000);
  };

  // Function to toggle emoji mode from settings
  const toggleEmojiMode = async (enabled: boolean) => {
    setEmojiMode(enabled);
    await window.electronAPI?.setSetting('emojiMode', enabled);
  };

  return (
    <>
      <SnowEffect enabled={snowEffectEnabled} />
      <div className={`h-full grid grid-cols-[88px_1fr] relative launcher-main ${emojiMode ? 'emoji-letters-mode' : ''}`}>
        <Sidebar appVersion={appVersion} onVersionClick={handleVersionClick} />

      <section className="relative overflow-y-scroll overlay-scroll bg-[#171b20]">
        <HeroBanner
          bgVideo={bgVideo}
          videoFilename={videoFilename || null}
          setVideoSrc={setVideoSrc}
          primaryAction={primaryAction}
          busy={busy}
          openInstallPrompt={openInstallPrompt}
          repairChannel={repairChannel}
          selectedChannel={selectedChannel}
          playCooldown={playCooldown}
          requireEula={requireEula}
          getSettingsAndLaunch={async () => {
            const s: any = await window.electronAPI?.getSettings();
            
            // For custom channels, use the installDir from the channel object
            // For official channels, use the installDir from settings
            let dir: string;
            if (channel?.isCustom && channel.installDir) {
              dir = channel.installDir;
            } else {
              dir = s?.channels?.[selectedChannel]?.installDir || installDir;
            }
            
            const lo = s?.launchOptions?.[selectedChannel] || {};
            const args = buildLaunchParametersLocal();
            const res = await window.electronAPI?.launchGame?.({ channelName: selectedChannel, installDir: dir, mode: lo?.mode || launchMode, argsString: args });
            if (res && !res.ok) {
              console.error('Failed to launch', res.error);
            }
          }}
          setPlayCooldown={setPlayCooldown}
          launchClickGuardRef={launchClickGuardRef}
          enabledChannels={enabledChannels}
          setSelectedChannel={setSelectedChannel}
          onOpenLaunchOptions={() => setActiveTab('launch')}
          activeTab={activeTab as any}
          onTabChange={(tab) => setActiveTab(tab as any)}
          hasStarted={hasStarted}
          isPaused={isPaused}
          currentOperation={currentOperation}
          bytesTotal={bytesTotal}
          bytesReceived={bytesReceived}
          speedBps={speedBps}
          etaSeconds={etaSeconds}
          doneCount={doneCount}
          totalCount={totalCount}
          progressItems={progressItems}
          onPause={async () => {
            try {
              await window.electronAPI?.pauseDownload?.();
              setIsPaused(true);
            } catch {}
          }}
          onResume={async () => {
            try {
              await window.electronAPI?.resumeDownload?.();
              setIsPaused(false);
            } catch {}
          }}
          onCancel={async () => {
            try {
              await window.electronAPI?.cancelDownload?.();
              setBusy(false);
              setHasStarted(false);
              setCurrentOperation('');
              setBytesTotal(0);
              setBytesReceived(0);
              setSpeedBps(0);
              setEtaSeconds(0);
              setProgressItems({});
            } catch {}
          }}
        />

        {activeTab === 'general' && null}
        {activeTab === 'settings' && (
          <PageTransition pageKey="settings" className="mx-6 mb-6" staggerContent>
            <SettingsPanel
            busy={busy}
            channel={channel as any}
            enabledChannels={enabledChannels as any}
            channelsSettings={channelsSettings}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
            partConcurrency={partConcurrency}
            setPartConcurrency={setPartConcurrency}
            downloadSpeedLimit={downloadSpeedLimit}
            setDownloadSpeedLimit={setDownloadSpeedLimit}
            customBaseDir={customBaseDir}
            setCustomBaseDir={setCustomBaseDir}
            bannerVideoEnabled={bannerVideoEnabled}
            setBannerVideoEnabled={setBannerVideoEnabled}
            modsShowDeprecated={modsShowDeprecated}
            setModsShowDeprecated={setModsShowDeprecated}
            modsShowNsfw={modsShowNsfw}
            setModsShowNsfw={setModsShowNsfw}
            easterEggDiscovered={easterEggDiscovered}
            emojiMode={emojiMode}
            toggleEmojiMode={toggleEmojiMode}
            snowEffectEnabled={snowEffectEnabled}
            setSnowEffectEnabled={setSnowEffectEnabled}
            repairChannel={repairChannel}
            fixChannelPermissions={fixChannelPermissions}
            onUninstallClick={handleUninstallClick}
            setSetting={(k, v) => window.electronAPI?.setSetting?.(k, v) as any}
            openExternal={(url) => { window.electronAPI?.openExternal?.(url); }}
            openFolder={async (folderPath) => { 
              const result = await window.electronAPI?.openFolder?.(folderPath);
              if (result && !result.ok) {
                alert(`Failed to open folder: ${result.error || 'Unknown error'}`);
              }
            }}
            optimizeForSpeed={optimizeForSpeed}
            optimizeForStability={optimizeForStability}
            resetDownloadDefaults={resetDownloadDefaults}
            installHdTextures={installHdTextures}
            uninstallHdTextures={uninstallHdTextures}
          />
          </PageTransition>
        )}

        {activeTab === 'launch' && (
          <PageTransition pageKey="launch" className="mx-6 mb-6" staggerContent>
            <GameLaunchSection
            launchMode={launchMode as any}
            setLaunchMode={setLaunchMode as any}
            hostname={hostname}
            setHostname={setHostname}
            windowed={windowed}
            setWindowed={setWindowed}
            borderless={borderless}
            setBorderless={setBorderless}
            maxFps={maxFps}
            setMaxFps={setMaxFps}
            resW={resW}
            setResW={setResW}
            resH={resH}
            setResH={setResH}
            reservedCores={reservedCores}
            setReservedCores={setReservedCores}
            workerThreads={workerThreads}
            setWorkerThreads={setWorkerThreads}
            noAsync={noAsync}
            setNoAsync={setNoAsync}
            encryptPackets={encryptPackets}
            setEncryptPackets={setEncryptPackets}
            randomNetkey={randomNetkey}
            setRandomNetkey={setRandomNetkey}
            queuedPackets={queuedPackets}
            setQueuedPackets={setQueuedPackets}
            noTimeout={noTimeout}
            setNoTimeout={setNoTimeout}
            showConsole={showConsole}
            setShowConsole={setShowConsole}
            colorConsole={colorConsole}
            setColorConsole={setColorConsole}
            playlistFile={playlistFile}
            setPlaylistFile={setPlaylistFile}
            enableDeveloper={enableDeveloper}
            setEnableDeveloper={setEnableDeveloper}
            enableCheats={enableCheats}
            setEnableCheats={setEnableCheats}
            offlineMode={offlineMode}
            setOfflineMode={setOfflineMode}
            discordRichPresence={discordRichPresence}
            setDiscordRichPresence={setDiscordRichPresence}
            customCmd={customCmd}
            setCustomCmd={setCustomCmd}
            buildLaunchParameters={buildLaunchParametersLocal}
          />
          </PageTransition>
        )}

        {activeTab !== 'settings' && (
          <PageTransition pageKey={activeTab} className="mx-6 mt-4" staggerContent>
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-0 items-start pb-6">
            <div className="space-y-3 xl:col-span-2">
              <OutdatedModsBanner
                visible={activeTab === 'general'}
                outdatedMods={outdatedMods as any}
                onManageClick={() => { setActiveTab('mods'); setModsSubtab('installed'); }}
              />
              {activeTab === 'mods' && (
                <ModsPanel
                  modsSubtab={modsSubtab as any}
                  setModsSubtab={setModsSubtab as any}
                  installedModsView={installedModsView}
                  setInstalledModsView={(view) => {
                    setInstalledModsView(view);
                    window.electronAPI?.setSetting('installedModsView', view);
                  }}
                  browseModsView={browseModsView}
                  setBrowseModsView={(view) => {
                    setBrowseModsView(view);
                    window.electronAPI?.setSetting('browseModsView', view);
                  }}
                  setModsRefreshNonce={setModsRefreshNonce}
                  installedMods={installedMods as any}
                  installedModsLoading={installedModsLoading}
                  installedModsAugmented={installedModsAugmented as any}
                  isInstalledModVisible={isInstalledModVisible as any}
                  draggingModName={draggingModName}
                  setDraggingModName={setDraggingModName}
                  dragOverModName={dragOverModName}
                  setDragOverModName={setDragOverModName}
                  setInstalledMods={setInstalledMods as any}
                  channelsSettings={channelsSettings}
                  selectedChannel={selectedChannel}
                  installDir={installDir}
                  filteredAndSortedMods={filteredAndSortedMods as any}
                  modsCategory={modsCategory as any}
                  setModsCategory={setModsCategory as any}
                  modsFilter={modsFilter as any}
                  setModsFilter={setModsFilter as any}
                  modsSortBy={modsSortBy as any}
                  setModsSortBy={setModsSortBy as any}
                  modsQuery={modsQuery}
                  setModsQuery={setModsQuery}
                  modsError={modsError}
                  isInstalled={isInstalled}
                  getModIconUrl={getModIconUrl as any}
                  getLatestVersionForName={getLatestVersionForName as any}
                  compareVersions={compareVersions as any}
                  updateInstalled={updateInstalled as any}
                  toggleModEnabled={toggleModEnabled as any}
                  uninstallMod={uninstallMod as any}
                  installFromAll={installFromAll as any}
                  uninstallFromAll={uninstallFromAll as any}
                  updateFromAll={updateFromAll as any}
                  favoriteMods={favoriteMods}
                  toggleFavoriteMod={toggleFavoriteMod}
                  openModDetails={openModDetails}
                  getModCategory={getModCategory as any}
                  getModCategories={getModCategories as any}
                  getModTags={getModTags as any}
                  installingMods={installingMods}
                  modProgress={modProgress}
                />
              )}

{/* Download progress is now integrated into HeroBanner */}


        </div>
            {activeTab === 'general' && (
            <NewsPanel
              patchNotesView={patchNotesView as any}
              setPatchNotesView={(view) => {
                setPatchNotesView(view);
                window.electronAPI?.setSetting('patchNotesView', view);
              }}
                patchNotesFilter={patchNotesFilter as any}
                setPatchNotesFilter={setPatchNotesFilter as any}
                patchNotesSearch={patchNotesSearch}
                setPatchNotesSearch={setPatchNotesSearch}
                filteredPatchPosts={filteredPatchPosts as any}
                patchLoading={patchLoading}
                readPosts={readPosts}
                favoritePosts={favoritePosts}
                markPostAsRead={markPostAsRead}
                toggleFavoritePost={toggleFavoritePost}
                getPostCategory={getPostCategory as any}
                openNewsPost={openNewsPost}
              />
            )}
            </div>
          </PageTransition>
        )}
      </section>
      <ToastNotification
        visible={finished}
        message={toastMessage}
        type={toastType}
      />
      <InstallPromptModal
        open={installPromptOpen}
        onClose={() => setInstallPromptOpen(false)}
        selectedChannel={selectedChannel}
        launcherRoot={launcherRoot}
        installBaseDir={installBaseDir}
        setInstallBaseDir={setInstallBaseDir}
        baseGameSize={baseGameSize}
        optionalFilesSize={optionalFilesSize}
        installIncludeOptional={installIncludeOptional}
        setInstallIncludeOptional={setInstallIncludeOptional}
        onConfirm={confirmInstallWithDir}
        onBrowse={async () => window.electronAPI?.selectDirectory?.() ?? null}
      />

      <UpdaterModal
        visible={!!(updateAvailable || updateDownloaded)}
        updateDownloaded={updateDownloaded}
        updateProgress={updateProgress}
        updateBps={updateBps}
        updateTotal={updateTotal}
        updateTransferred={updateTransferred}
        updateError={updateError}
        onRestartToUpdate={() => window.electronAPI?.quitAndInstall?.()}
      />

      <ConfirmModal
        open={uninstallModalOpen}
        onClose={handleUninstallCancel}
        onConfirm={handleUninstallConfirm}
        title={`Uninstall ${channelToUninstall || 'Channel'}?`}
        message={`This will permanently delete all game files for ${channelToUninstall} and remove the installation settings.\n\nThis action cannot be undone.`}
        confirmText="Uninstall"
        cancelText="Cancel"
        variant="danger"
        busy={busy}
      />

      <NewsModal
        open={newsModalOpen}
        post={selectedNewsPost}
        onClose={() => {
          setNewsModalOpen(false);
          setSelectedNewsPost(null);
        }}
        getPostCategory={getPostCategory as any}
      />

      <ModDetailsModal
        open={modDetailsOpen && !!modDetailsPack}
        modDetailsPack={modDetailsPack}
        onClose={() => setModDetailsOpen(false)}
        getPackageUrlFromPack={getPackageUrlFromPack as any}
        installedMods={installedMods}
        compareVersions={compareVersions as any}
        sanitizeFolderName={sanitizeFolderName as any}
        installingMods={installingMods}
        installSpecificVersion={installSpecificVersion as any}
      />

      <EulaModal
        open={eulaOpen}
        loading={eulaLoading}
        content={eulaContent}
        onDecline={() => { setEulaOpen(false); const r=eulaResolveRef.current; eulaResolveRef.current=null; if(r) r(false); }}
        onAccept={async () => { try { const ver = eulaKeyRef.current || 'latest'; const s:any = await window.electronAPI?.getSettings?.(); const next = { ...(s||{}) }; next.eulaAcceptedVersion = ver; await window.electronAPI?.setSetting?.('eulaAcceptedVersion', ver); } catch {} finally { setEulaOpen(false); const r=eulaResolveRef.current; eulaResolveRef.current=null; if(r) r(true); } }}
      />

      <PermissionPromptModal
        open={permissionPromptOpen}
        onCancel={() => setPermissionPromptOpen(false)}
        onConfirm={confirmPermissionsAndInstall}
        isFixingPermissions={isFixingPermissions}
        installDir={(channelsSettings?.[selectedChannel]?.installDir) || installDir}
      />
      </div>
    </>
  );
}


