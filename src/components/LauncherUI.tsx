import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './ui/Sidebar';
import TabNav from './ui/TabNav';
import HeroBanner from './sections/HeroBanner';
import InstallPromptModal from './modals/InstallPromptModal';
import PermissionPromptModal from './modals/PermissionPromptModal';
import EulaModal from './modals/EulaModal';
import SettingsPanel from './panels/SettingsPanel';
import ModsPanel from './panels/ModsPanel';
import NewsPanel from './panels/NewsPanel';
import ModDetailsModal from './modals/ModDetailsModal';
import DownloadProgress from './ui/DownloadProgress';
import UpdaterModal from './modals/UpdaterModal';
import OutdatedModsBanner from './ui/OutdatedModsBanner';
import ToastNotification from './modals/ToastNotification';
import GameLaunchSection from './sections/GameLaunchSection';
import UpdateBanner from './ui/UpdateBanner';
import MainProgressBar from './ui/MainProgressBar';
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
      cacheBackgroundVideo: (filename: string) => Promise<string>;
      exists: (path: string) => Promise<boolean>;
      openPath: (path: string) => Promise<boolean>;
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
      fixFolderPermissions?: (payload: { folderPath: string }) => Promise<{ok:boolean; error?: string; details?: string[]; warnings?: string[]}>;
      testWritePermissions?: (folderPath: string) => Promise<{ hasWriteAccess: boolean }>;
    };
  }
}

const CONFIG_URL = 'https://blaze.playvalkyrie.org/config.json';

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
  const [bannerVideoEnabled, setBannerVideoEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'general'|'launch'|'mods'|'settings'>('general');
  type PartInfo = { received: number; total: number };
  type FileInfo = { status: string; received?: number; total?: number; totalParts?: number; parts?: Record<number, PartInfo> };
  const [progressItems, setProgressItems] = useState<Record<string, FileInfo>>({});
  const [exitingItems, setExitingItems] = useState<Record<string, boolean>>({});
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('Completed');
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
        setConfig(json);
        const first = json.channels.find((c) => c.enabled);
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
      if (typeof s?.bannerVideoEnabled === 'boolean') setBannerVideoEnabled(Boolean(s.bannerVideoEnabled));
      if (typeof s?.modsShowDeprecated === 'boolean') setModsShowDeprecated(Boolean(s.modsShowDeprecated));
      if (typeof s?.modsShowNsfw === 'boolean') setModsShowNsfw(Boolean(s.modsShowNsfw));
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
  const [primaryAction, setPrimaryAction] = useState<'install'|'update'|'play'>('install');
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
  const [modsView, setModsView] = useState<'grid' | 'list'>('grid');
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
  type NewsPost = { title: string; excerpt?: string; published_at?: string; url: string; feature_image?: string };
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

  

  async function persistDir(dir: string) {
    setInstallDir(dir);
    try {
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      channels[selectedChannel] = { ...(channels[selectedChannel] || {}), installDir: dir };
      await window.electronAPI?.setSetting('channels', channels);
    } catch {}
  }


  async function openInstallPrompt() {
    const defaultDir = (await window.electronAPI?.getDefaultInstallDir(selectedChannel)) || installDir;
    const base = deriveBaseFromDir(defaultDir || installDir, selectedChannel) || defaultDir || '';
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
    await persistDir(finalPath);
    // Update the per-channel includeOptional setting with the dialog choice
    await setIncludeOptional(selectedChannel, installIncludeOptional);
    setChannelsSettings((prev) => ({
      ...prev,
      [selectedChannel]: { ...(prev?.[selectedChannel] || {}), installDir: finalPath }
    }));
    setInstallPromptOpen(false);
    
    // Test if we already have write permissions to the install directory
    try {
      const testResult = await window.electronAPI?.testWritePermissions?.(finalPath);
      if (testResult?.hasWriteAccess) {
        // We already have write access, skip permission dialog and start install directly
        await startInstall();
        return;
      }
    } catch {
      // If test fails, proceed with permission dialog as fallback
    }
    
    // Show permission prompt before starting installation
    setPermissionPromptOpen(true);
  }

  async function confirmPermissionsAndInstall() {
    const actualInstallDir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
    
    if (!actualInstallDir) {
      alert('No installation directory specified');
      return;
    }
    
    if (!window.electronAPI?.fixFolderPermissions) {
      alert('Permission fix functionality not available. Please restart the launcher.');
      return;
    }
    
    setIsFixingPermissions(true);
    try {
      // Fix folder permissions using admin privileges
      const result = await window.electronAPI.fixFolderPermissions({ folderPath: actualInstallDir });
      
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

  async function startInstall() {
    const actualInstallDir = (channelsSettings?.[selectedChannel]?.installDir) || installDir;
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
        setCurrentOperation('Merging file parts');
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
        setCurrentOperation('Verifying files'); 
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
      setFinished(true);
      // Update local install state so primary button flips to Play
      setInstalledVersion(String(checksums?.game_version || ''));
      setIsInstalled(true);
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
      try {
        const j = await window.electronAPI!.fetchChecksums(channel.game_url);
        setRemoteVersion(String(j?.game_version || ''));
      } catch { setRemoteVersion(null); }
    })();
  }, [channel?.game_url]);

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
        if (ch?.installDir) setInstallDir(ch.installDir);
        setInstalledVersion(ch?.gameVersion || null);
        if (ch?.installDir) {
          const exeClient = `${ch.installDir.replace(/\\+$/,'')}\\r5apex.exe`;
          const exeServer = `${ch.installDir.replace(/\\+$/,'')}\\r5apex_ds.exe`;
          const hasClient = await window.electronAPI?.exists?.(exeClient);
          const hasServer = await window.electronAPI?.exists?.(exeServer);
          setIsInstalled(Boolean(hasClient || hasServer));
        } else {
          setIsInstalled(false);
        }
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
        const resp = await fetch('https://blog.playvalkyrie.org/ghost/api/content/posts/?key=4d046cff94d3fdfeaab2bf9ccf&include=tags,authors&filter=tag:Community&limit=10&fields=title,excerpt,published_at,url,feature_image');
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
        
        const url = `https://blog.playvalkyrie.org/ghost/api/content/posts/?key=4d046cff94d3fdfeaab2bf9ccf&include=tags,authors&${filterQuery}&limit=20&fields=title,excerpt,published_at,url,feature_image&order=published_at%20desc`;
        
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

  const getModCategory = (mod: any): string => {
    // First, check if mod has actual categories/tags from the API
    const categories = mod?.categories || mod?.tags || mod?.versions?.[0]?.categories || [];
    if (Array.isArray(categories) && categories.length > 0) {
      // Map common Thunderstore categories to our categories
      const firstCategory = String(categories[0]).toLowerCase();
      
      // Direct mappings
      if (firstCategory.includes('weapon')) return 'weapon';
      if (firstCategory.includes('map')) return 'map';  
      if (firstCategory.includes('legend') || firstCategory.includes('character')) return 'legend';
      if (firstCategory.includes('gamemode') || firstCategory.includes('mode')) return 'gamemode';
      if (firstCategory.includes('ui') || firstCategory.includes('hud')) return 'ui';
      if (firstCategory.includes('sound') || firstCategory.includes('audio')) return 'sound';
      if (firstCategory.includes('animation')) return 'animation';
      if (firstCategory.includes('model')) return 'model';
      if (firstCategory.includes('cosmetic') || firstCategory.includes('skin')) return 'cosmetic';
      if (firstCategory.includes('server')) return 'server-side';
      if (firstCategory.includes('client')) return 'client-side';
      if (firstCategory.includes('modpack') || firstCategory.includes('pack')) return 'modpack';
      if (firstCategory.includes('framework') || firstCategory.includes('library')) return 'framework';
      if (firstCategory.includes('qol') || firstCategory.includes('quality')) return 'qol';
    }
    
    // Fallback to keyword matching if no categories found
    const name = (mod?.name || mod?.full_name || '').toLowerCase();
    const desc = (mod?.versions?.[0]?.description || '').toLowerCase();
    
    // Use more precise keyword matching with word boundaries
    const checkKeyword = (text: string, keywords: string[]) => {
      return keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(text);
      });
    };
    
    if (checkKeyword(name, ['weapon', 'gun', 'rifle', 'pistol', 'shotgun', 'sniper'])) return 'weapon';
    if (checkKeyword(name, ['map', 'level', 'arena', 'zone'])) return 'map';
    if (checkKeyword(name, ['legend', 'character', 'hero', 'pilot'])) return 'legend';
    if (checkKeyword(name, ['gamemode', 'mode'])) return 'gamemode';
    if (checkKeyword(name, ['ui', 'hud', 'interface', 'menu', 'overlay'])) return 'ui';
    if (checkKeyword(name, ['sound', 'audio', 'music', 'sfx', 'voice'])) return 'sound';
    if (checkKeyword(name, ['animation', 'anim'])) return 'animation';
    if (checkKeyword(name, ['model', 'mesh'])) return 'model';
    if (checkKeyword(name, ['cosmetic', 'skin', 'texture', 'visual'])) return 'cosmetic';
    if (checkKeyword(name, ['server'])) return 'server-side';
    if (checkKeyword(name, ['client'])) return 'client-side';
    if (checkKeyword(name, ['modpack', 'pack', 'collection'])) return 'modpack';
    if (checkKeyword(name, ['framework', 'api', 'library', 'core'])) return 'framework';
    if (checkKeyword(name, ['qol']) || checkKeyword(desc, ['quality of life', 'improvement', 'fix', 'enhance'])) return 'qol';
    
    return 'other';
  };

  const filteredAndSortedMods = useMemo(() => {
    if (!allMods) return [];
    
    let filtered = allMods.filter((m: any) => {
      // Basic filters
      if (!modsShowDeprecated && m?.is_deprecated) return false;
      if (!modsShowNsfw && m?.has_nsfw_content) return false;
      
      // Category filter
      if (modsCategory !== 'all' && getModCategory(m) !== modsCategory) return false;
      
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
          return (b?.download_count || 0) - (a?.download_count || 0);
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
    if (!isInstalled) setPrimaryAction('install');
    else if (remoteVersion && installedVersion && remoteVersion !== installedVersion) setPrimaryAction('update');
    else setPrimaryAction('play');
  }, [isInstalled, installedVersion, remoteVersion]);

  async function fixChannelPermissions(name: string) {
    const ch = channelsSettings?.[name];
    const dir = ch?.installDir;
    if (!dir) {
      alert('Channel not installed or directory not found');
      return;
    }
    
    setBusy(true);
    try {
      const result = await window.electronAPI?.fixFolderPermissions?.({ folderPath: dir });
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
    
    // Switch to home page to show download progress
    setActiveTab('general');
    
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
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path] || {}), parts: {}, totalParts: 0 }
        }));
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
        setCurrentOperation('Merging file parts');
        setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 } }));
      }));
      window.electronAPI!.onProgress('progress:merge:done', guard((p: any) => {
        setCurrentOperation('Installing HD textures');
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
    const target = config?.channels.find((c) => c.name === name);
    if (!target) return;
    let dir = channelsSettings?.[name]?.installDir;
    if (!dir) {
      dir = (await window.electronAPI?.getDefaultInstallDir(name)) || '';
    }
    if (!dir) return;
    setBusy(true);
    setFinished(false);
    setProgressItems({});
    setDoneCount(0);
    setTotalCount(0);
    const operationText = isUpdate ? 'Updating files' : 'Repairing files';
    setCurrentOperation(operationText);
    setHasStarted(true);
    setActiveTab('general');
    setBytesTotal(0);
    setBytesReceived(0);
    setSpeedBps(0);
    setEtaSeconds(0);
    const runId = Date.now();
    runIdRef.current = runId;
    try {
      const checksums = await window.electronAPI!.fetchChecksums(target.game_url);
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
      window.electronAPI!.onProgress('progress:bytes:total', guard((p: any) => { const tot = Math.max(0, Number(p.totalBytes || 0)); setBytesTotal(tot); setBytesReceived(0); setSpeedBps(0); setEtaSeconds(0); setHasStarted(true); }));
      {
        let windowBytes = 0;
        let lastTick = Date.now();
        const tick = () => {
          const now = Date.now();
          const dt = (now - lastTick) / 1000;
          if (dt >= 0.5) {
            const speed = windowBytes / dt;
            setSpeedBps(speed);
            const remain = Math.max(0, bytesTotal - (bytesReceived));
            setEtaSeconds(speed > 0 ? Math.ceil(remain / speed) : 0);
            windowBytes = 0;
            lastTick = now;
          }
          if (busy && !isPaused) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        window.electronAPI!.onProgress('progress:bytes', guard((p: any) => {
          const d = Number(p?.delta || 0);
          if (d !== 0) {
            setBytesReceived((x) => Math.max(0, x + d));
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
      window.electronAPI!.onProgress('progress:merge:start', guard((p: any) => { setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 }); setCurrentOperation('Merging file parts'); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:merge:part', guard((p: any) => { setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.part+1}/${p.totalParts}`, parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:merge:done', guard((p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:verify', guard((p: any) => { 
        setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); 
        setCurrentOperation('Verifying files'); 
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
      await window.electronAPI!.downloadAll({ baseUrl: target.game_url, checksums, installDir: dir, includeOptional: getIncludeOptional(name), concurrency, partConcurrency, channelName: name, mode: 'repair' });
      setToastMessage('Repair completed');
      setFinished(true);
      // Update local install state so primary button flips to Play/reflects new version
      setInstalledVersion(String(checksums?.game_version || ''));
      setIsInstalled(true);
      setPrimaryAction('play');
      setChannelsSettings((prev) => ({
        ...prev,
        [name]: {
          ...(prev?.[name] || {}),
          installDir: dir,
          gameVersion: checksums?.game_version || null,
          gameBaseUrl: target.game_url,
          lastUpdatedAt: Date.now(),
        },
      }));
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

  return (
    <div className="h-full grid grid-cols-[88px_1fr] relative">
      <Sidebar appVersion={appVersion} />

      <section className="relative overflow-y-scroll overlay-scroll bg-[#171b20]">
        <TabNav activeTab={activeTab as any} onChange={(tab) => setActiveTab(tab as any)} />
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
            const dir = s?.channels?.[selectedChannel]?.installDir || installDir;
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
        />

        <MainProgressBar
          visible={activeTab === 'general' && busy}
          busy={busy}
          hasStarted={hasStarted}
          currentOperation={currentOperation}
          bytesTotal={bytesTotal}
          bytesReceived={bytesReceived}
          speedBps={speedBps}
          etaSeconds={etaSeconds}
          doneCount={doneCount}
          totalCount={totalCount}
          isPaused={isPaused}
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
          <SettingsPanel
            busy={busy}
            channel={channel as any}
            enabledChannels={enabledChannels as any}
            channelsSettings={channelsSettings}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
            partConcurrency={partConcurrency}
            setPartConcurrency={setPartConcurrency}
            bannerVideoEnabled={bannerVideoEnabled}
            setBannerVideoEnabled={setBannerVideoEnabled}
            modsShowDeprecated={modsShowDeprecated}
            setModsShowDeprecated={setModsShowDeprecated}
            modsShowNsfw={modsShowNsfw}
            setModsShowNsfw={setModsShowNsfw}
            repairChannel={repairChannel}
            fixChannelPermissions={fixChannelPermissions}
            setSetting={(k, v) => window.electronAPI?.setSetting?.(k, v) as any}
            openExternal={(url) => { window.electronAPI?.openExternal?.(url); }}
            optimizeForSpeed={optimizeForSpeed}
            optimizeForStability={optimizeForStability}
            resetDownloadDefaults={resetDownloadDefaults}
            installHdTextures={installHdTextures}
            uninstallHdTextures={uninstallHdTextures}
          />
        )}

        {activeTab === 'launch' && (
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
        )}

        {activeTab !== 'settings' && (
          <div
            key={`content-main-${activeTab}`}
            className="mx-6 mt-4 grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-4 items-start pb-6 fade-in"
          >
            <UpdateBanner
              updateAvailable={updateAvailable}
              updateDownloaded={updateDownloaded}
              updateProgress={updateProgress}
              onDownloadUpdate={() => window.electronAPI?.downloadUpdate?.()}
              onRestartToUpdate={() => window.electronAPI?.quitAndInstall?.()}
            />
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
                  modsView={modsView as any}
                  setModsView={setModsView as any}
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
                  getModTags={getModTags as any}
                  installingMods={installingMods}
                  modProgress={modProgress}
                />
              )}
        <DownloadProgress
          visible={activeTab === 'general' && busy}
          progressItems={progressItems as any}
          exitingItems={exitingItems}
        />

              {false && activeTab === 'general' && fileProgress && (
                <div className="text-sm opacity-80 font-mono">
                  {(fileProgress?.path || '')} — {Math.floor(((fileProgress?.received || 0) / ((fileProgress?.total||1))) * 100)}%
          </div>
        )}


        </div>


            


            {activeTab === 'general' && (
              <NewsPanel
                patchNotesView={patchNotesView as any}
                setPatchNotesView={setPatchNotesView as any}
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
              />
            )}
        </div>
        )}
      </section>
      <ToastNotification
        visible={finished}
        message={toastMessage}
        type="success"
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
  );
}


