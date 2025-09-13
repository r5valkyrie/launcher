import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import TabNav from './TabNav';
import HeroBanner from './HeroBanner';

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
  const [includeOptional, setIncludeOptional] = useState(false);
  const [concurrency, setConcurrency] = useState<number>(8);
  const [partConcurrency, setPartConcurrency] = useState<number>(6);
  const [bannerVideoEnabled, setBannerVideoEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'general'|'downloads'|'launch'|'mods'|'settings'>('general');
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

  function deriveBaseFromDir(dir: string, channelName: string): string {
    if (!dir) return '';
    const norm = dir.replace(/\\+$/,'');
    const suffix = `\\${channelName.replace(/\\+/g,'\\')}`;
    if (norm.toLowerCase().endsWith(suffix.toLowerCase())) {
      return norm.slice(0, -suffix.length) || '';
    }
    return norm;
  }

  async function openInstallPrompt() {
    const defaultDir = (await window.electronAPI?.getDefaultInstallDir(selectedChannel)) || installDir;
    const base = deriveBaseFromDir(defaultDir || installDir, selectedChannel) || defaultDir || '';
    setInstallBaseDir(base || '');
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
    setChannelsSettings((prev) => ({
      ...prev,
      [selectedChannel]: { ...(prev?.[selectedChannel] || {}), installDir: finalPath }
    }));
    setInstallPromptOpen(false);
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
      const filtered = (checksums.files || []).filter((f: any) => includeOptional || !f.optional);
      setTotalCount(filtered.length);
      setDoneCount(0);
      const guard = (fn: (x:any)=>void) => (payload: any) => { if (runIdRef.current !== runId) return; fn(payload); };
      window.electronAPI!.onProgress('progress:start', guard((p: any) => { 
        setOverall(p); 
        setHasStarted(true); 
        setCurrentOperation('Installing files'); 
      }));
      window.electronAPI!.onProgress('progress:bytes:total', guard((p: any) => { const tot = Math.max(0, Number(p.totalBytes || 0)); setBytesTotal(tot); bytesTotalRef.current = tot; setBytesReceived(0); bytesReceivedRef.current = 0; setSpeedBps(0); setEtaSeconds(0); setHasStarted(true); setReceivedAnyBytes(false); }));
      {
        let windowBytes = 0;
        let lastTick = Date.now();
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
            setBytesReceived((x) => {
              const tentative = Math.max(0, x + d);
              const capped = bytesTotalRef.current > 0 ? Math.min(tentative, bytesTotalRef.current) : tentative;
              bytesReceivedRef.current = capped;
              return capped;
            });
            if (d > 0) windowBytes += d; else windowBytes = Math.max(0, windowBytes + d);
            if (d > 0) setReceivedAnyBytes(true);
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
      window.electronAPI!.onProgress('progress:verify', guard((p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setCurrentOperation('Verifying files'); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); }));
      window.electronAPI!.onProgress('progress:skip', guard((p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'skipped', parts: {}, totalParts: 0 } })); if (fileProgress?.path?.startsWith(p.path)) setFileProgress(null); }));
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
      await window.electronAPI!.downloadAll({ baseUrl: channel.game_url, checksums, installDir: actualInstallDir, includeOptional, concurrency, partConcurrency, channelName: channel.name, mode: 'install' });
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

  function getPackByName(name?: string): any | null {
    const needle = String(name || '').toLowerCase();
    const packs = (allMods || []);
    let pack = packs.find((p: any) => String(p?.name||'').toLowerCase() === needle);
    if (!pack) pack = packs.find((p: any) => String(p?.full_name||'').toLowerCase() === needle);
    if (!pack) {
      const base = needle.split('-')[0];
      pack = packs.find((p: any) => {
        const n = String(p?.name||'').toLowerCase();
        const fn = String(p?.full_name||'').toLowerCase();
        return n === base || fn.startsWith(`${base}-`);
      });
    }
    return pack || null;
  }

  function isInstalledModVisible(mod: InstalledMod): boolean {
    const pack = getPackByName(mod.name || mod.id);
    const isDeprecated = !!(pack && pack.is_deprecated);
    const isNsfw = !!(pack && pack.has_nsfw_content);
    if (!modsShowDeprecated && isDeprecated) return false;
    if (!modsShowNsfw && isNsfw) return false;
    return true;
  }

  function sanitizeFolderName(s: string): string {
    return String(s || 'mod').replace(/[\\/:*?"<>|]/g, '_');
  }

  function deriveFolderFromDownloadUrl(url?: string): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      // Expect: /package/download/{owner}/{package}/{version}/
      const pkgIdx = parts.findIndex((p) => p.toLowerCase() === 'package');
      if (pkgIdx >= 0 && parts[pkgIdx + 1]?.toLowerCase() === 'download') {
        const owner = parts[pkgIdx + 2];
        const pack = parts[pkgIdx + 3];
        if (owner && pack) return sanitizeFolderName(`${owner}-${pack}`);
      }
      return null;
    } catch {
      return null;
    }
  }

  function compareVersions(a?: string|null, b?: string|null): number {
    const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
    const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const x = pa[i] || 0; const y = pb[i] || 0;
      if (x > y) return 1; if (x < y) return -1;
    }
    return 0;
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
    const pack = getPackByName(mod.name);
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
        const resp = await fetch('https://blog.playvalkyrie.org/ghost/api/content/posts/?key=4d046cff94d3fdfeaab2bf9ccf&include=tags,authors&filter=tag:community&limit=10&fields=title,excerpt,published_at,url,feature_image');
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
        const communityTag = 'community';
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
          posts = posts.sort((a, b) => {
            const aCategory = getPostCategoryFromTags(a.tags);
            const bCategory = getPostCategoryFromTags(b.tags);
            
            // Community posts first, then dev-blog, then patch-notes
            const categoryOrder = { 'community': 0, 'dev-blog': 1, 'patch-notes': 2 };
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
    if (!post.tags) return 'patch-notes';
    const tags = Array.isArray(post.tags) ? post.tags : [];
    if (tags.some((tag: any) => tag.name === 'community')) return 'community';
    if (tags.some((tag: any) => tag.name === 'dev-blog')) return 'dev-blog';
    return 'patch-notes';
  };

  const getPostCategoryFromTags = (tags: any): string => {
    if (!tags) return 'patch-notes';
    const tagArray = Array.isArray(tags) ? tags : [];
    if (tagArray.some((tag: any) => tag.name === 'community')) return 'community';
    if (tagArray.some((tag: any) => tag.name === 'dev-blog')) return 'dev-blog';
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

  const getModCategory = (mod: any): string => {
    const name = (mod?.name || mod?.full_name || '').toLowerCase();
    const desc = (mod?.versions?.[0]?.description || '').toLowerCase();
    
    if (name.includes('weapon') || name.includes('gun') || desc.includes('weapon')) return 'weapons';
    if (name.includes('map') || name.includes('level') || desc.includes('map')) return 'maps';
    if (name.includes('ui') || name.includes('hud') || desc.includes('interface')) return 'ui';
    if (name.includes('audio') || name.includes('sound') || desc.includes('audio')) return 'audio';
    if (name.includes('gameplay') || desc.includes('gameplay')) return 'gameplay';
    return 'all';
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

  function buildLaunchParameters(): string {
    const params: string[] = [];
    // Common
    if (reservedCores) params.push(`-numreservedcores ${reservedCores}`);
    if (workerThreads) params.push(`-numworkerthreads ${workerThreads}`);
    params.push(encryptPackets ? '+net_encryptionEnable 1' : '+net_encryptionEnable 0');
    params.push(randomNetkey ? '+net_useRandomKey 1' : '+net_useRandomKey 0');
    params.push(queuedPackets ? '+net_queued_packet_thread 1' : '+net_queued_packet_thread 0');
    if (noTimeout) params.push('-notimeout');
    const mode = launchMode;
    if (showConsole || mode === 'SERVER') params.push('-wconsole'); else params.push('-noconsole');
    if (colorConsole) params.push('-ansicolor');
    if (playlistFile) params.push(`-playlistfile "${playlistFile}"`);
    if (mapIndex > 0) params.push(`+map ${mapIndex}`);
    if (playlistIndex > 0) params.push(`+launchplaylist ${playlistIndex}`);
    if (enableDeveloper) params.push('-dev -devsdk');
    if (enableCheats) params.push('+sv_cheats 1');
    if (offlineMode) params.push('-offline');
    // Hostname/visibility only for dedicated server mode
    if (mode === 'SERVER' && hostname) {
      params.push(`+hostname "${hostname}"`);
      params.push(`+sv_pylonVisibility ${visibility}`);
    }
    // Video
    params.push(windowed ? '-windowed' : '-fullscreen');
    params.push(borderless ? '-noborder' : '-forceborder');
    if (maxFps && /^-?\d+$/.test(maxFps)) params.push(`+fps_max ${maxFps}`);
    if (/^\d+$/.test(resW)) params.push(`-w ${resW}`);
    if (/^\d+$/.test(resH)) params.push(`-h ${resH}`);
    // Mode specifics
    if (mode === 'CLIENT') params.push('-noserverdll');
    if (noAsync) {
      params.push('-noasync');
      params.push('+async_serialize 0 +sv_asyncAIInit 0 +sv_asyncSendSnapshot 0 +sv_scriptCompileAsync 0 +physics_async_sv 0');
      if (mode !== 'SERVER') {
        params.push('+buildcubemaps_async 0 +cl_scriptCompileAsync 0 +cl_async_bone_setup 0 +cl_updatedirty_async 0 +mat_syncGPU 1 +mat_sync_rt 1 +mat_sync_rt_flushes_gpu 1 +net_async_sendto 0 +physics_async_cl 0');
      }
    }
    if (customCmd) params.push(customCmd);
    return params.join(' ').trim();
  }

  async function persistLaunchOptions() {
    const lo = { mode: launchMode, hostname, visibility, windowed, borderless, maxFps, resW, resH, reservedCores, workerThreads, encryptPackets, randomNetkey, queuedPackets, noTimeout, showConsole, colorConsole, playlistFile, mapIndex, playlistIndex, enableDeveloper, enableCheats, offlineMode, noAsync, customCmd };
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
  }, [selectedChannel, launchMode, hostname, visibility, windowed, borderless, maxFps, resW, resH, reservedCores, workerThreads, encryptPackets, randomNetkey, queuedPackets, noTimeout, showConsole, colorConsole, playlistFile, mapIndex, playlistIndex, enableDeveloper, enableCheats, offlineMode, noAsync, customCmd]);

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
    try {
      const checksums = await window.electronAPI!.fetchChecksums(target.game_url);
      const filtered = (checksums.files || []).filter((f: any) => includeOptional || !f.optional);
      setTotalCount(filtered.length);
      setDoneCount(0);
      window.electronAPI!.onProgress('progress:start', (p: any) => { 
        setOverall(p); 
        setHasStarted(true); 
        setCurrentOperation(operationText); 
      });
      window.electronAPI!.onProgress('progress:bytes:total', (p: any) => { const tot = Math.max(0, Number(p.totalBytes || 0)); setBytesTotal(tot); setBytesReceived(0); setSpeedBps(0); setEtaSeconds(0); setHasStarted(true); });
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
        window.electronAPI!.onProgress('progress:bytes', (p: any) => {
          const d = Number(p?.delta || 0);
          if (d !== 0) {
            setBytesReceived((x) => Math.max(0, x + d));
            if (d > 0) windowBytes += d; else windowBytes = Math.max(0, windowBytes + d);
          }
        });
      }
      window.electronAPI!.onProgress('progress:file', (p: any) => {
        setFileProgress(p);
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: 'downloading', received: p.received, total: p.total }
        }));
      });
      window.electronAPI!.onProgress('progress:part', (p: any) => {
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
      });
      window.electronAPI!.onProgress('progress:merge:start', (p: any) => { setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 }); setCurrentOperation('Merging file parts'); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:merge:part', (p: any) => { setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.part+1}/${p.totalParts}`, parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:merge:done', (p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:verify', (p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setCurrentOperation('Verifying files'); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:skip', (p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'skipped', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:done', (p: any) => { setOverall(p); setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); setDoneCount((x) => x + 1); });
      await window.electronAPI!.downloadAll({ baseUrl: target.game_url, checksums, installDir: dir, includeOptional, concurrency, partConcurrency, channelName: name, mode: 'repair' });
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
          const pack = getPackByName(name);
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
            const args = buildLaunchParameters();
            const res = await window.electronAPI?.launchGame?.({ channelName: selectedChannel, installDir: dir, mode: lo?.mode || launchMode, argsString: args });
            if (res && !res.ok) {
              console.error('Failed to launch', res.error);
            }
          }}
          setPlayCooldown={setPlayCooldown}
          launchClickGuardRef={launchClickGuardRef}
          enabledChannels={enabledChannels}
          setSelectedChannel={setSelectedChannel}
          onOpenSettings={() => setActiveTab('settings')}
        />


        {activeTab === 'general' && null}
        {activeTab === 'settings' && (
          <div key="content-settings" className="mx-6 grid grid-cols-1 xl:grid-cols-2 gap-4 fade-in">
            <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4">
              <div className="mb-2 w-full text-sm opacity-80">Downloads</div>
              <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">Concurrent files</span>
            <select
              className="select select-bordered select-sm"
              value={concurrency}
              onChange={async (e) => {
                const n = Math.max(1, Math.min(16, Number(e.target.value)));
                setConcurrency(n);
                await window.electronAPI?.setSetting('concurrency', n);
              }}
            >
              {[1,2,4,6,8,12,16,20,24].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
              <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">Concurrent parts</span>
            <select
              className="select select-bordered select-sm"
              value={partConcurrency}
              onChange={async (e) => {
                const n = Math.max(1, Math.min(16, Number(e.target.value)));
                setPartConcurrency(n);
                await window.electronAPI?.setSetting('partConcurrency', n);
              }}
            >
              {[1,2,4,6,8,12,16,20,24].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
              <label className="label cursor-pointer justify-start gap-3 ml-2">
                <input type="checkbox" className="toggle-switch" checked={includeOptional} onChange={(e) => setIncludeOptional(e.target.checked)} />
                <span className="label-text">Include optional files</span>
              </label>
              {channel && (
                <div className="ml-auto text-xs opacity-70 truncate">
                  Using: <span className="font-mono">{channel.game_url}</span>
                </div>
              )}
        </div>

            <div className="glass rounded-xl p-4 grid gap-3">
              <div className="text-sm opacity-80">Appearance</div>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle-switch"
                  checked={bannerVideoEnabled}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    setBannerVideoEnabled(v);
                    await window.electronAPI?.setSetting('bannerVideoEnabled', v);
                  }}
                />
                <span className="label-text">Enable banner video</span>
              </label>
            </div>

            <div className="glass rounded-xl p-4 grid gap-3">
              <div className="text-sm opacity-80">Mods</div>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle-switch"
                  checked={modsShowDeprecated}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    setModsShowDeprecated(v);
                    await window.electronAPI?.setSetting('modsShowDeprecated', v);
                  }}
                />
                <span className="label-text">Show deprecated mods</span>
              </label>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle-switch"
                  checked={modsShowNsfw}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    setModsShowNsfw(v);
                    await window.electronAPI?.setSetting('modsShowNsfw', v);
                  }}
                />
                <span className="label-text">Show NSFW mods</span>
              </label>
            </div>

            <div className="glass rounded-xl p-4 col-span-1 xl:col-span-2 mb-4">
              <div className="mb-3 text-sm opacity-80">Manage installed channels</div>
              <div className="grid gap-2">
                {enabledChannels.map((c) => {
                  const ch = channelsSettings?.[c.name];
                  const dir = ch?.installDir;
                  const ver = ch?.gameVersion;
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="min-w-24 badge badge-ghost">{c.name}</div>
                      <div className="text-xs opacity-80 truncate">{dir || 'Not installed'}</div>
                      {ver && <div className="ml-auto text-xs opacity-60">{ver}</div>}
                      <button className="btn btn-sm btn-outline" disabled={!dir || busy} onClick={() => repairChannel(c.name)}>Repair</button>
                      <button className="btn btn-sm btn-outline" disabled={!dir || busy} onClick={() => fixChannelPermissions(c.name)}>Fix Permissions</button>
                      {(() => {
                        const info = config?.channels.find((x) => x.name === c.name);
                        const dedi = info?.dedi_url;
                        if (!dedi) return null;
                        return (
                          <button className="btn btn-sm btn-outline" onClick={() => window.electronAPI?.openExternal?.(dedi)}>Download Dedicated Server</button>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'launch' && (
          <div key="content-launch" className="mx-6 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto pb-6 fade-in launch-panels">
            {/* Left column */}
            <div className="grid gap-4">
              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Session</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-80">Mode</span>
                  <div className="btn-group">
                    {(['CLIENT','HOST','SERVER'] as LaunchMode[]).map((m) => (
                      <button key={m} className={`btn btn-sm ${launchMode===m?'btn-active btn-primary':'btn-ghost'}`} onClick={() => setLaunchMode(m)}>{m}</button>
                    ))}
                  </div>
                </div>
                {launchMode === 'SERVER' && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm opacity-80">Hostname</span>
                    <input className="input input-bordered input-sm w-full" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="Server name" />
          </div>
        )}
              </div>

              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Video</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-80">Window</span>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={windowed} onChange={(e)=>setWindowed(e.target.checked)} /><span className="label-text">Windowed</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={borderless} onChange={(e)=>setBorderless(e.target.checked)} /><span className="label-text">Borderless</span></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="form-control flex flex-col">
                    <span className="label-text text-xs opacity-70">Max FPS</span>
                    <input className="input input-bordered input-sm mt-1 w-full" value={maxFps} onChange={(e)=>setMaxFps(e.target.value)} placeholder="0" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="form-control flex flex-col">
                      <span className="label-text text-xs opacity-70">Width</span>
                      <input className="input input-bordered input-sm mt-1 w-full" value={resW} onChange={(e)=>setResW(e.target.value)} placeholder="1920" />
                    </label>
                    <label className="form-control flex flex-col">
                      <span className="label-text text-xs opacity-70">Height</span>
                      <input className="input input-bordered input-sm mt-1 w-full" value={resH} onChange={(e)=>setResH(e.target.value)} placeholder="1080" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Performance</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="form-control flex flex-col">
                    <span className="label-text text-xs opacity-70">Reserved cores</span>
                    <input className="input input-bordered input-sm mt-1 w-full" value={reservedCores} onChange={(e)=>setReservedCores(e.target.value)} />
                  </label>
                  <label className="form-control flex flex-col">
                    <span className="label-text text-xs opacity-70">Worker threads</span>
                    <input className="input input-bordered input-sm mt-1 w-full" value={workerThreads} onChange={(e)=>setWorkerThreads(e.target.value)} />
                  </label>
                </div>
                <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={noAsync} onChange={(e)=>setNoAsync(e.target.checked)} /><span className="label-text">Disable async systems</span></label>
              </div>
            </div>

            {/* Right column */}
            <div className="grid gap-4">
              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Network</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={encryptPackets} onChange={(e)=>setEncryptPackets(e.target.checked)} /><span className="label-text">Encrypt</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={randomNetkey} onChange={(e)=>setRandomNetkey(e.target.checked)} /><span className="label-text">Random key</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={queuedPackets} onChange={(e)=>setQueuedPackets(e.target.checked)} /><span className="label-text">Queued pkts</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={noTimeout} onChange={(e)=>setNoTimeout(e.target.checked)} /><span className="label-text">No timeout</span></label>
                </div>
              </div>

              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Console & Playlist</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={showConsole} onChange={(e)=>setShowConsole(e.target.checked)} /><span className="label-text">Console</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={colorConsole} onChange={(e)=>setColorConsole(e.target.checked)} /><span className="label-text">ANSI color</span></label>
                </div>
                <label className="form-control flex flex-col">
                  <span className="label-text text-xs opacity-70">Playlist file (string)</span>
                  <input className="input input-bordered input-sm w-full mt-1" value={playlistFile} onChange={(e)=>setPlaylistFile(e.target.value)} placeholder="playlists_r5_patch.txt" />
                </label>
        </div>

              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Gameplay & Advanced</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={enableDeveloper} onChange={(e)=>setEnableDeveloper(e.target.checked)} /><span className="label-text">Developer</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={enableCheats} onChange={(e)=>setEnableCheats(e.target.checked)} /><span className="label-text">Cheats</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle-switch" checked={offlineMode} onChange={(e)=>setOfflineMode(e.target.checked)} /><span className="label-text">Offline</span></label>
                </div>
                <label className="form-control flex flex-col">
                  <span className="label-text text-xs opacity-70">Custom command line</span>
                  <input className="input input-bordered input-sm mt-1 w-full" value={customCmd} onChange={(e)=>setCustomCmd(e.target.value)} placeholder="-debug +foo 1" />
                </label>
                <div className="text-[11px] opacity-70 font-mono break-words p-2 bg-base-300/40 rounded">
                  {buildLaunchParameters()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && null}

        {activeTab !== 'settings' && (
          <div
            key={`content-main-${activeTab}`}
            className={`mx-6 mt-4 grid ${activeTab==='downloads' ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[1.2fr_.8fr]'} gap-4 items-start pb-6 fade-in`}
          >
            {updateAvailable && !updateDownloaded && (
              <div className="glass rounded-xl overflow-hidden xl:col-span-2">
                <div className="flex items-stretch">
                  <div className="px-4 py-3 text-sm">Launcher update available</div>
                  <div className="ml-auto">
                    <button className="btn btn-primary h-full rounded-none" onClick={() => window.electronAPI?.downloadUpdate?.()}>
                      {updateProgress > 0 ? `${updateProgress.toFixed(0)}%` : 'Download'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {updateDownloaded && (
              <div className="glass rounded-xl overflow-hidden xl:col-span-2">
                <div className="flex items-stretch">
                  <div className="px-4 py-3 text-sm">Update ready. Restart now?</div>
                  <div className="ml-auto">
                    <button className="btn btn-primary h-full rounded-none" onClick={() => window.electronAPI?.quitAndInstall?.()}>Restart</button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3 xl:col-span-2">
              {activeTab === 'general' && (outdatedMods.length > 0) && (
                <div className="glass rounded-xl overflow-hidden">
                  <div className="flex items-stretch">
                    <div className="px-4 py-3 text-sm">
                      {outdatedMods.length === 1 ? '1 mod has an update:' : `${outdatedMods.length} mods have updates:`}
                      <div className="mt-2 text-xs opacity-80 space-y-1">
                        {outdatedMods.slice(0,6).map((m, idx) => (
                          <div key={String(m?.name||'')+idx} className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[40vw]">{m?.name}</span>
                            <span className="opacity-70">—</span>
                            <span className="font-mono">{m?.current || '—'}</span>
                            <span className="opacity-70">→</span>
                            <span className="font-mono text-warning">{m?.latest || '—'}</span>
                          </div>
                        ))}
                        {outdatedMods.length > 6 && (
                          <div className="opacity-60">and {outdatedMods.length - 6} more…</div>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto p-2">
                      <button className="btn btn-primary" onClick={() => { setActiveTab('mods'); setModsSubtab('installed'); }}>
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'mods' && (
                <div className="space-y-4">
                  {/* Enhanced Header with Controls */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">Mod Manager</h3>
                        <div className="btn-group">
                          <button className={`btn btn-sm ${modsSubtab==='installed'?'btn-active btn-primary':''}`} onClick={()=>setModsSubtab('installed')}>
                            Installed ({(installedMods || []).length})
                          </button>
                          <button className={`btn btn-sm ${modsSubtab==='all'?'btn-active btn-primary':''}`} onClick={()=>setModsSubtab('all')}>
                            Browse ({filteredAndSortedMods.length})
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="btn-group">
                          <button 
                            className={`btn btn-sm ${modsView === 'grid' ? 'btn-active' : ''}`}
                            onClick={() => setModsView('grid')}
                            title="Grid View"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7"/>
                              <rect x="14" y="3" width="7" height="7"/>
                              <rect x="3" y="14" width="7" height="7"/>
                              <rect x="14" y="14" width="7" height="7"/>
                            </svg>
                          </button>
                          <button 
                            className={`btn btn-sm ${modsView === 'list' ? 'btn-active' : ''}`}
                            onClick={() => setModsView('list')}
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
                        </div>
                        
                        <div className="tooltip tooltip-primary tooltip-bottom z-20" data-tip="Refresh">
                          <button className="btn btn-sm btn-primary" onClick={()=> setModsRefreshNonce((x)=>x+1)}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="23 4 23 10 17 10"/>
                              <polyline points="1 20 1 14 7 14"/>
                              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {modsSubtab === 'all' && (
                      <>
                        {/* Advanced Filters */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {/* Category Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm opacity-70">Category:</span>
                            <select 
                              className="select select-bordered select-sm"
                              value={modsCategory}
                              onChange={(e) => setModsCategory(e.target.value as any)}
                            >
                              <option value="all">All Categories</option>
                              <option value="weapons">🔫 Weapons</option>
                              <option value="maps">🗺️ Maps</option>
                              <option value="ui">🖥️ UI/HUD</option>
                              <option value="gameplay">🎮 Gameplay</option>
                              <option value="audio">🔊 Audio</option>
                            </select>
                          </div>

                          {/* Status Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm opacity-70">Status:</span>
                            <select 
                              className="select select-bordered select-sm"
                              value={modsFilter}
                              onChange={(e) => setModsFilter(e.target.value as any)}
                            >
                              <option value="all">All Mods</option>
                              <option value="available">Available</option>
                              <option value="installed">Installed</option>
                              <option value="updates">Need Updates</option>
                            </select>
                          </div>

                          {/* Sort By */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm opacity-70">Sort:</span>
                            <select 
                              className="select select-bordered select-sm"
                              value={modsSortBy}
                              onChange={(e) => setModsSortBy(e.target.value as any)}
                            >
                              <option value="name">Name</option>
                              <option value="date">Date Added</option>
                              <option value="downloads">Downloads</option>
                              <option value="rating">Rating</option>
                            </select>
                          </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search mods by name, author, or description..." 
                            className="input input-bordered w-full pr-10"
                            value={modsQuery}
                            onChange={(e) => setModsQuery(e.target.value)}
                          />
                          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                          </svg>
                        </div>
                      </>
                    )}
                  </div>

                  {modsSubtab === 'installed' && (
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {installedModsLoading && <div className="text-xs opacity-70">Loading…</div>}
                      {!installedModsLoading && (installedModsAugmented||[]).filter(isInstalledModVisible).map((m) => (
                        <div
                          key={m.name}
                          className={`glass-soft rounded-lg border border-white/10 relative transition-transform duration-150 ${dragOverModName===m.name?'ring-1 ring-primary scale-[1.01]':''} ${draggingModName===m.name?'opacity-60':''}`}
                          draggable
                          onDragStart={(e)=>{ setDraggingModName(m.name); e.dataTransfer.setData('text/mod-name', String(m.name)); e.dataTransfer.effectAllowed='move'; }}
                          onDragEnd={()=>{ setDraggingModName(null); setDragOverModName(null); }}
                          onDragEnter={()=> setDragOverModName(m.name)}
                          onDragLeave={(e)=>{ if ((e.target as HTMLElement).closest('[data-mod-card]')) return; setDragOverModName(null); }}
                          onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; }}
                          onDrop={(e)=>{ e.preventDefault(); const name=e.dataTransfer.getData('text/mod-name'); setDragOverModName(null); if(!name||name===m.name) return; setInstalledMods((prev)=>{ const list=(prev||[]).slice(); const fromIdx=list.findIndex(x=>x.name===name); const toIdx=list.findIndex(x=>x.name===m.name); if(fromIdx<0||toIdx<0||fromIdx===toIdx) return prev||[]; const [item]=list.splice(fromIdx,1); list.splice(toIdx,0,item); (async()=>{ try { const dir = (channelsSettings?.[selectedChannel]?.installDir) || installDir; if (dir) await window.electronAPI?.reorderMods?.(dir, list.map(x=>String(x.id||''))); } catch{} })(); return list; }); }}
                          data-mod-card
                        >
                          <div className="flex items-stretch min-h-[96px]">
                            <div className="w-28 bg-base-300/40 flex items-center justify-center overflow-hidden">
                              {m as any && (m as any).iconDataUrl ? (
                                <img src={(m as any).iconDataUrl} alt="" className="w-full h-full object-cover rounded-l-[var(--panel-radius)]" />
                              ) : getModIconUrl(m.name || m.id) ? (
                                <img src={getModIconUrl(m.name || m.id)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                            <div className="flex-1 p-3 flex flex-col">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{String(m.name || m.id || '').replace(/_/g, ' ')}</div>
                                  <div className="text-[11px] opacity-60 truncate">Installed: {m.version || '—'}{(() => { const lv = getLatestVersionForName(m.name); return lv && m.version && compareVersions(m.version, lv) < 0 ? ` • Latest: ${lv}` : ''; })()}</div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  {(() => { const latest = getLatestVersionForName(m.name); const needs = latest && m.version && compareVersions(m.version, latest) < 0; const key = (m.folder || m.name); if (needs) return (
                                    <button className={`btn btn-md btn-warning ${installingMods[key]==='install'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=> updateInstalled(m)}>
                                      {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                                    </button>
                                  ); return null; })()}
                                  <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="toggle-switch" checked={!!m.enabled} onChange={()=>toggleModEnabled(m)} />
                                  </label>
                                  {(() => { const key = (m.folder || m.name); return (
                                    <div className="tooltip tooltip-error tooltip-top z-20" data-tip="Uninstall">
                                      <button className={`btn btn-md btn-error ${(!m.hasManifest || installingMods[key]==='uninstall')?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>uninstallMod(m)} disabled={!m.hasManifest}>
                                        <span className="text-xl leading-none">🗑</span>
                                      </button>
                                    </div>
                                  ); })()}
                                  <div className="cursor-grab active:cursor-grabbing select-none opacity-70 text-2xl ml-1" title="Drag to reorder">≡</div>
                                </div>
                              </div>
                              {m.description && <div className="text-xs opacity-70 mt-2 line-clamp-2">{m.description}</div>}
                            </div>
                          </div>
                          {(() => { const key = (m.folder || m.name); if (installingMods[key]==='install') return (
                            <div className="absolute bottom-0 right-2 left-30 m-0 p-0">
                              {(() => { const mp = modProgress[key]; const pct = mp?.total ? Math.min(100, Math.floor((mp.received/mp.total)*100)) : (mp?.phase==='extracting' ? 100 : 0); const phaseLabel = mp?.phase==='extracting' ? 'Extracting' : 'Downloading'; return (
                                <>
                                  <div className="flex items-center justify-between text-[10px] opacity-80 leading-none mb-0">
                                    <span>{phaseLabel}</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <progress className="progress progress-primary progress-xs w-full rounded-none m-0" value={pct} max={100}></progress>
                                </>
                              ); })()}
                            </div>
                          ); return null; })()}
                        </div>
                      ))}
                      {!installedModsLoading && (installedModsAugmented||[]).length===0 && (
                        <div className="text-xs opacity-70">No mods installed.</div>
                      )}
                    </div>
                  )}

                  {modsSubtab === 'all' && (
                    <div className="glass rounded-xl p-4">
                      {allModsLoading && (
                        <div className={modsView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`loading-${i}`} className="glass-soft rounded-lg border border-white/10 animate-pulse">
                              {modsView === 'grid' && <div className="w-full pb-[40%] bg-base-300/50" />}
                              <div className="p-4 space-y-3">
                                <div className="h-4 bg-base-300/60 rounded w-3/4" />
                                <div className="h-3 bg-base-300/40 rounded w-full" />
                                <div className="h-3 bg-base-300/40 rounded w-2/3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(!allModsLoading && modsError) && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">⚠️</div>
                          <div className="text-sm opacity-80 text-warning">{modsError}</div>
                        </div>
                      )}
                      
                      {!isInstalled && !allModsLoading && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">🎮</div>
                          <div className="text-sm opacity-80 text-warning">Install the selected channel before installing mods.</div>
                        </div>
                      )}
                      
                      {!allModsLoading && isInstalled && (
                        <>
                          {modsView === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredAndSortedMods.slice(0, 60).map((m: any) => {
                                const latest = Array.isArray(m?.versions) && m.versions[0] ? m.versions[0] : null;
                                const rawTitle = m?.name || (m?.full_name?.split('-')?.[0]) || 'Unknown';
                                const title = String(rawTitle).replace(/_/g, ' ');
                                const ver = latest?.version_number || '';
                                const installed = (installedMods || []).find((im) => String(im.name || '').toLowerCase() === String(m?.name || '').toLowerCase());
                                const state = installed ? (compareVersions(installed?.version || null, ver) < 0 ? 'update' : 'installed') : 'not';
                                const key = sanitizeFolderName(m?.full_name || m?.name || title);
                                const modId = m?.uuid4 || m?.full_name || title;
                                const isFavorite = favoriteMods.has(modId);
                                const category = getModCategory(m);
                                
                                return (
                                  <div key={modId} className="group glass-soft rounded-lg border border-white/10 relative hover:border-primary/30 transition-all hover:shadow-lg flex flex-col h-full">
                                    {/* Mod Image */}
                                    <div className="relative w-full pb-[50%] bg-base-300/40 overflow-hidden rounded-t-lg">
                                      {m?.versions?.[0]?.icon ? (
                                        <img src={m.versions[0].icon} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                                          {category === 'weapons' ? '🔫' : category === 'maps' ? '🗺️' : category === 'ui' ? '🖥️' : category === 'gameplay' ? '🎮' : category === 'audio' ? '🔊' : '📦'}
                                        </div>
                                      )}
                                      
                                      {/* Category Badge */}
                                      <div className="absolute top-2 left-2">
                                        <span className={`badge badge-sm ${category === 'weapons' ? 'badge-error' : category === 'maps' ? 'badge-info' : category === 'ui' ? 'badge-warning' : category === 'gameplay' ? 'badge-success' : category === 'audio' ? 'badge-secondary' : 'badge-neutral'}`}>
                                          {category === 'weapons' ? '🔫 Weapons' : category === 'maps' ? '🗺️ Maps' : category === 'ui' ? '🖥️ UI' : category === 'gameplay' ? '🎮 Gameplay' : category === 'audio' ? '🔊 Audio' : '📦 Other'}
                                        </span>
                                      </div>

                                      {/* Status Badge */}
                                      {(state === 'installed' || state === 'update') && (
                                        <div className="absolute top-2 right-2">
                                          <span className={`badge badge-sm ${state === 'update' ? 'badge-warning' : 'badge-success'}`}>
                                            {state === 'update' ? 'Update Available' : 'Installed'}
                                          </span>
                                        </div>
                                      )}

                                      {/* Favorite Button */}
                                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                                          onClick={() => toggleFavoriteMod(modId)}
                                          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                          ⭐
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Mod Info */}
                                    <div className="p-4 flex flex-col h-full">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">{title}</h4>
                                        <div className="text-xs opacity-60 mb-2">v{ver}</div>
                                        {m?.versions?.[0]?.description && (
                                          <p className="text-xs opacity-80 line-clamp-3 mb-3">{m.versions[0].description}</p>
                                        )}
                                        
                                        {/* Download/Rating Info */}
                                        <div className="flex items-center gap-3 text-xs opacity-60 mb-3">
                                          {m?.download_count && (
                                            <span>📥 {m.download_count.toLocaleString()}</span>
                                          )}
                                          {m?.rating_score && (
                                            <span>⭐ {m.rating_score.toFixed(1)}</span>
                                          )}
                                        </div>
                                        
                                        {isFavorite && (
                                          <div className="text-xs opacity-50 flex items-center gap-1 mb-2">
                                            ⭐ Favorited
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Action Buttons - Pinned to Bottom */}
                                      <div className="flex items-center gap-2 mt-auto">
                                        {state === 'not' && (
                                          <button 
                                            className={`btn btn-sm btn-success flex-1 ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                            onClick={()=>installFromAll(m)} 
                                            disabled={!isInstalled || !!installingMods[key]}
                                          > 
                                            {installingMods[key]==='install' ? 'Installing…' : 'Install'}
                                          </button>
                                        )}
                                        {state === 'installed' && (
                                          <button 
                                            className={`btn btn-sm btn-error flex-1 ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                            onClick={()=>uninstallFromAll(m)}
                                          >
                                            🗑 Uninstall
                                          </button>
                                        )}
                                        {state === 'update' && (
                                          <>
                                            <button 
                                              className={`btn btn-sm btn-warning flex-1 ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                              onClick={()=>updateFromAll(m)} 
                                              disabled={!isInstalled}
                                            >
                                              {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                                            </button>
                                            <button 
                                              className={`btn btn-sm btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                              onClick={()=>uninstallFromAll(m)}
                                              title="Uninstall"
                                            >
                                              🗑
                                            </button>
                                          </>
                                        )}
                                        <button 
                                          className="btn btn-sm btn-ghost" 
                                          onClick={()=>openModDetails(m)}
                                          title="View details"
                                        >
                                          ℹ️
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    {installingMods[key]==='install' && (
                                      <div className="absolute bottom-0 left-0 right-0 p-2">
                                        {(() => { 
                                          const mp = modProgress[key]; 
                                          const pct = mp?.total ? Math.min(100, Math.floor((mp.received/mp.total)*100)) : (mp?.phase==='extracting' ? 100 : 0); 
                                          const phaseLabel = mp?.phase==='extracting' ? 'Extracting' : 'Downloading'; 
                                          return (
                                            <div className="bg-base-100/90 rounded p-2">
                                              <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                                                <span>{phaseLabel}</span>
                                                <span>{pct}%</span>
                                              </div>
                                              <progress className="progress progress-primary progress-xs w-full" value={pct} max={100}></progress>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {filteredAndSortedMods.slice(0, 60).map((m: any) => {
                                const latest = Array.isArray(m?.versions) && m.versions[0] ? m.versions[0] : null;
                                const rawTitle = m?.name || (m?.full_name?.split('-')?.[0]) || 'Unknown';
                                const title = String(rawTitle).replace(/_/g, ' ');
                                const ver = latest?.version_number || '';
                                const installed = (installedMods || []).find((im) => String(im.name || '').toLowerCase() === String(m?.name || '').toLowerCase());
                                const state = installed ? (compareVersions(installed?.version || null, ver) < 0 ? 'update' : 'installed') : 'not';
                                const key = sanitizeFolderName(m?.full_name || m?.name || title);
                                const modId = m?.uuid4 || m?.full_name || title;
                                const isFavorite = favoriteMods.has(modId);
                                const category = getModCategory(m);
                                
                                return (
                                  <div key={modId} className="flex gap-4 p-4 glass-soft rounded-lg border border-white/10 hover:border-primary/30 transition-all hover:shadow-md relative">
                                    {/* Mod Icon */}
                                    <div className="w-16 h-16 bg-base-300/40 rounded-lg overflow-hidden flex-shrink-0">
                                      {m?.versions?.[0]?.icon ? (
                                        <img src={m.versions[0].icon} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                                          {category === 'weapons' ? '🔫' : category === 'maps' ? '🗺️' : category === 'ui' ? '🖥️' : category === 'gameplay' ? '🎮' : category === 'audio' ? '🔊' : '📦'}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Mod Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-sm">{title}</h4>
                                            <span className={`badge badge-xs ${category === 'weapons' ? 'badge-error' : category === 'maps' ? 'badge-info' : category === 'ui' ? 'badge-warning' : category === 'gameplay' ? 'badge-success' : category === 'audio' ? 'badge-secondary' : 'badge-neutral'}`}>
                                              {category === 'weapons' ? '🔫' : category === 'maps' ? '🗺️' : category === 'ui' ? '🖥️' : category === 'gameplay' ? '🎮' : category === 'audio' ? '🔊' : '📦'}
                                            </span>
                                            {(state === 'installed' || state === 'update') && (
                                              <span className={`badge badge-xs ${state === 'update' ? 'badge-warning' : 'badge-success'}`}>
                                                {state === 'update' ? 'Update' : 'Installed'}
                                              </span>
                                            )}
                                            {isFavorite && <span className="text-xs">⭐</span>}
                                          </div>
                                          <div className="text-xs opacity-60 mb-1">v{ver}</div>
                                          {m?.versions?.[0]?.description && (
                                            <p className="text-xs opacity-80 line-clamp-2 mb-2">{m.versions[0].description}</p>
                                          )}
                                          <div className="flex items-center gap-3 text-xs opacity-60">
                                            {m?.download_count && (
                                              <span>📥 {m.download_count.toLocaleString()}</span>
                                            )}
                                            {m?.rating_score && (
                                              <span>⭐ {m.rating_score.toFixed(1)}</span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <button 
                                            className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                                            onClick={() => toggleFavoriteMod(modId)}
                                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                          >
                                            ⭐
                                          </button>
                                          
                                          {state === 'not' && (
                                            <button 
                                              className={`btn btn-sm btn-success ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                              onClick={()=>installFromAll(m)} 
                                              disabled={!isInstalled || !!installingMods[key]}
                                            > 
                                              {installingMods[key]==='install' ? 'Installing…' : 'Install'}
                                            </button>
                                          )}
                                          {state === 'installed' && (
                                            <button 
                                              className={`btn btn-sm btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                              onClick={()=>uninstallFromAll(m)}
                                            >
                                              🗑 Uninstall
                                            </button>
                                          )}
                                          {state === 'update' && (
                                            <>
                                              <button 
                                                className={`btn btn-sm btn-warning ${(!isInstalled || installingMods[key]==='install')?'btn-disabled pointer-events-none opacity-60':''}`} 
                                                onClick={()=>updateFromAll(m)} 
                                                disabled={!isInstalled}
                                              >
                                                {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                                              </button>
                                              <button 
                                                className={`btn btn-sm btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} 
                                                onClick={()=>uninstallFromAll(m)}
                                                title="Uninstall"
                                              >
                                                🗑
                                              </button>
                                            </>
                                          )}
                                          <button 
                                            className="btn btn-sm btn-ghost" 
                                            onClick={()=>openModDetails(m)}
                                            title="View details"
                                          >
                                            ℹ️
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    {installingMods[key]==='install' && (
                                      <div className="absolute bottom-2 left-20 right-2">
                                        {(() => { 
                                          const mp = modProgress[key]; 
                                          const pct = mp?.total ? Math.min(100, Math.floor((mp.received/mp.total)*100)) : (mp?.phase==='extracting' ? 100 : 0); 
                                          const phaseLabel = mp?.phase==='extracting' ? 'Extracting' : 'Downloading'; 
                                          return (
                                            <div className="bg-base-100/90 rounded p-2">
                                              <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                                                <span>{phaseLabel}</span>
                                                <span>{pct}%</span>
                                              </div>
                                              <progress className="progress progress-primary progress-xs w-full" value={pct} max={100}></progress>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {filteredAndSortedMods.length === 0 && !allModsLoading && (
                            <div className="text-center py-12">
                              <div className="text-4xl mb-4">🔍</div>
                              <h4 className="text-lg font-semibold mb-2">No mods found</h4>
                              <p className="text-sm opacity-70 mb-4">
                                {modsQuery.trim() 
                                  ? `No mods match "${modsQuery}"`
                                  : `No mods available for the selected filters`
                                }
                              </p>
                              {modsQuery.trim() && (
                                <button 
                                  className="btn btn-sm btn-outline"
                                  onClick={() => setModsQuery('')}
                                >
                                  Clear Search
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="text-xs opacity-60 mt-4 flex items-center justify-between">
                    <div>Mods powered by <a className="link" href="https://thunderstore.io/c/r5valkyrie" target="_blank" rel="noreferrer">Thunderstore</a></div>
                    <div className="opacity-70">Tip: Drag installed mods to change load order.</div>
                  </div>
                </div>
              )}
              {activeTab === 'general' && (busy && (hasStarted || overall)) && (
                <div className="glass rounded-xl p-4">
                  {(() => {
                    const trackingByBytes = receivedAnyBytes && bytesTotal > 0;
                    let percent: number;
                    if (trackingByBytes) {
                      percent = Math.min(100, (bytesReceived / (bytesTotal || 1)) * 100);
                    } else if (overall && typeof overall.total === 'number') {
                      const completedSoFar = typeof overall.completed === 'number' ? Math.min(overall.completed, overall.total || overall.completed) : Math.min(overall.index + 1, overall.total || (overall.index + 1));
                      percent = Math.min(100, (completedSoFar / (overall.total || 1)) * 100);
                    } else {
                      percent = totalCount > 0 ? Math.min(100, ((doneCount / totalCount) * 100)) : 0;
                    }
                    const checkedNumerator = overall && typeof overall.total === 'number'
                      ? (typeof overall.completed === 'number' ? overall.completed : (overall.index + 1))
                      : doneCount;
                    const checkedDenominator = overall && typeof overall.total === 'number'
                      ? (overall.total || totalCount)
                      : totalCount;
                    return (
                      <>
                        {currentOperation && (
                          <div className="mb-2 text-sm opacity-70 flex items-center gap-2">
                            <div className="loading loading-spinner loading-xs"></div>
                            <span>{currentOperation}</span>
                          </div>
                        )}
                        <progress className="progress w-full" value={percent} max={100}></progress>
                        <div className="mt-2 text-xs opacity-80 flex items-center gap-3 font-mono">
                          {trackingByBytes ? (
                            <>
                              <span>{Number(percent).toFixed(1)}%</span>
                              <span>•</span>
                              <span>{(speedBps/1024/1024).toFixed(2)} MB/s</span>
                              <span>•</span>
                              <span>ETA {etaSeconds > 0 ? `${Math.floor(etaSeconds/60)}m ${etaSeconds%60}s` : '—'}</span>
                              {fileProgress && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]" title={fileProgress.path}>
                                    {(() => {
                                      // Extract filename from path like "path/file.pak (part 17/20)" -> "file.pak (part 17/20)"
                                      const pathParts = fileProgress.path.split('/');
                                      const lastPart = pathParts[pathParts.length - 1] || fileProgress.path;
                                      return lastPart;
                                    })()}
                                  </span>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <span>
                                {currentOperation || 'Checking files'} {checkedNumerator}/{checkedDenominator}
                              </span>
                              {overall?.path && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]" title={overall.path}>
                                    {(() => {
                                      // Extract filename from path, handling cases with parentheses
                                      const pathParts = overall.path.split('/');
                                      const lastPart = pathParts[pathParts.length - 1] || overall.path;
                                      return lastPart;
                                    })()}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                          <span className="ml-auto flex items-center gap-2">
                            <button className="btn btn-outline btn-xs" onClick={() => setActiveTab('downloads')} title="View detailed progress">
                              📊 Details
                            </button>
                            {!isPaused ? (
                              <button className="btn btn-outline btn-xs" disabled={!busy} onClick={async () => { await window.electronAPI?.pauseDownload?.(); setIsPaused(true); }}>Pause</button>
                            ) : (
                              <button className="btn btn-outline btn-xs" onClick={async () => { await window.electronAPI?.resumeDownload?.(); setIsPaused(false); }}>Resume</button>
                            )}
                            <button className="btn btn-outline btn-xs" disabled={!busy} onClick={async () => { await window.electronAPI?.cancelDownload(); setIsPaused(false); setHasStarted(false); setBytesReceived(0); setSpeedBps(0); setEtaSeconds(0); setProgressItems({}); setBusy(false); }}>Cancel</button>
                          </span>
                        </div>
                      </>
                    );
                  })()}
          </div>
        )}

              {false && activeTab === 'general' && fileProgress && (
                <div className="text-sm opacity-80 font-mono">
                  {(fileProgress?.path || '')} — {Math.floor(((fileProgress?.received || 0) / ((fileProgress?.total||1))) * 100)}%
          </div>
        )}

              {activeTab === 'downloads' && (
                <div className="glass rounded-xl p-4 overflow-y-auto" style={{ minHeight: 'calc(88vh - 360px)' }}>
                  {Object.entries(progressItems).length > 0 ? Object.entries(progressItems).map(([p, info]) => {
              const percent = info.total ? Math.floor(((info.received || 0) / (info.total || 1)) * 100) : undefined;
                    const parts = info.parts || {};
                    const totalParts = info.totalParts || Object.keys(parts).length || 0;
              const exiting = !!exitingItems[p];
              return (
                      <div key={p} className={`py-2 ${exiting ? 'item-exit' : 'item-enter'}`}>
                        <div className="flex items-center justify-between text-sm">
                  <span className="font-mono truncate mr-3">{p}</span>
                  <span className="opacity-70">{info.status}{percent !== undefined ? ` — ${percent}%` : ''}</span>
                        </div>
                        {percent !== undefined && (
                          <progress className="progress progress-primary w-full mt-2" value={percent} max={100}></progress>
                        )}
                        {totalParts > 0 && (
                          <div className="mt-2 pl-3 border-l border-white/10">
                            {Array.from({ length: totalParts }).map((_, i) => {
                              const part = parts[i];
                              const pcent = part ? Math.floor(((part.received || 0) / (part.total || 1)) * 100) : 0;
                              return (
                                <div key={`${p}-part-${i}`} className={`text-xs mb-1 ${exiting ? 'item-exit' : 'item-enter'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="opacity-70">Part {i+1}/{totalParts}</span>
                                    <span className="opacity-60">{pcent}%</span>
                                  </div>
                                  <progress className="progress progress-accent w-full mt-1" value={pcent} max={100}></progress>
                </div>
              );
            })}
          </div>
                        )}
            </div>
                    );
                  }) : (
                    <div className="text-sm opacity-70 py-6 text-center">No downloads active.</div>
          )}
        </div>
              )}

        </div>

          {false && finished && (
            <div className="fixed top-4 right-4 flex flex-col gap-2 items-end pointer-events-none z-50">
              <div className="alert alert-success toast-slide-in-tr pointer-events-auto shadow-lg">
                <span>Completed</span>
              </div>
            </div>
          )}

            


            {activeTab === 'general' && (
              <div className="xl:col-span-2 space-y-4">
                {/* Enhanced Header with Controls */}
                <div className="glass rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">News & Updates</h3>
                      {!!(filteredPatchPosts && filteredPatchPosts.length) && (
                        <span className="badge badge-primary">{filteredPatchPosts.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* View Toggle */}
                      <div className="btn-group">
                        <button 
                          className={`btn btn-sm ${patchNotesView === 'grid' ? 'btn-active' : ''}`}
                          onClick={() => setPatchNotesView('grid')}
                          title="Grid View"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                          </svg>
                        </button>
                        <button 
                          className={`btn btn-sm ${patchNotesView === 'timeline' ? 'btn-active' : ''}`}
                          onClick={() => setPatchNotesView('timeline')}
                          title="Timeline View"
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
                      </div>
                      <a className="btn btn-sm btn-ghost" href={`https://blog.playvalkyrie.org/`} target="_blank" rel="noreferrer">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15,3 21,3 21,9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Blog
                      </a>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="tabs tabs-boxed bg-base-200/50">
                      <button 
                        className={`tab tab-sm ${patchNotesFilter === 'all' ? 'tab-active' : ''}`}
                        onClick={() => setPatchNotesFilter('all')}
                      >
                        All
                      </button>
                      <button 
                        className={`tab tab-sm ${patchNotesFilter === 'community' ? 'tab-active' : ''}`}
                        onClick={() => setPatchNotesFilter('community')}
                      >
                        👥 Community
                      </button>
                      <button 
                        className={`tab tab-sm ${patchNotesFilter === 'patch-notes' ? 'tab-active' : ''}`}
                        onClick={() => setPatchNotesFilter('patch-notes')}
                      >
                        📋 Patch Notes
                      </button>
                      <button 
                        className={`tab tab-sm ${patchNotesFilter === 'dev-blog' ? 'tab-active' : ''}`}
                        onClick={() => setPatchNotesFilter('dev-blog')}
                      >
                        🛠️ Dev Blog
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search news and updates..." 
                      className="input input-bordered w-full pr-10"
                      value={patchNotesSearch}
                      onChange={(e) => setPatchNotesSearch(e.target.value)}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                </div>

                {/* Content Area */}
                <div className="glass rounded-xl p-4 min-h-[400px]">
                  {patchLoading && (
                    <div className={patchNotesView === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={`ps-${i}`} className="glass-soft rounded-xl overflow-hidden border border-white/10 animate-pulse">
                          {patchNotesView === 'grid' && <div className="w-full pb-[40%] bg-base-300/50" />}
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-base-300/60 rounded w-3/4" />
                            <div className="h-3 bg-base-300/40 rounded w-full" />
                            <div className="h-3 bg-base-300/40 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!patchLoading && (
                    <>
                      {patchNotesView === 'grid' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {filteredPatchPosts.map((post) => {
                            const category = getPostCategory(post);
                            const isRead = readPosts.has(post.url);
                            const isFavorite = favoritePosts.has(post.url);
                            
                            return (
                              <div key={post.url} className={`group rounded-xl overflow-hidden glass border transition-all hover:shadow-lg ${isRead ? 'border-white/5 opacity-75' : 'border-white/10 hover:border-primary/40'}`}>
                                <div className="relative w-full pb-[40%] bg-base-300">
                                  {post.feature_image ? (
                                    <img loading="lazy" src={post.feature_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 grid place-items-center text-xs opacity-60">
                                      {category === 'patch-notes' ? '📋' : category === 'community' ? '👥' : '🛠️'}
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  
                                  {/* Category Badge */}
                                  <div className="absolute top-2 left-2">
                                    <span className={`badge badge-sm ${category === 'patch-notes' ? 'badge-primary' : category === 'community' ? 'badge-secondary' : 'badge-accent'}`}>
                                      {category === 'patch-notes' ? 'Patch' : category === 'community' ? 'Community' : 'Dev Blog'}
                                    </span>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                                      onClick={(e) => { e.preventDefault(); toggleFavoritePost(post.url); }}
                                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                      ⭐
                                    </button>
                                  </div>

                                  {!isRead && (
                                    <div className="absolute bottom-2 left-2">
                                      <span className="badge badge-xs badge-info">New</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-4">
                                  <h4 className="font-semibold text-sm mb-2 line-clamp-2">{post.title}</h4>
                                  <div className="flex items-center gap-2 text-xs opacity-60 mb-2">
                                    {post.published_at && (
                                      <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}</span>
                                    )}
                                  </div>
                                  {post.excerpt && (
                                    <p className="text-xs opacity-80 line-clamp-3 mb-3">{post.excerpt}</p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <a 
                                      href={post.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="btn btn-xs btn-primary"
                                      onClick={() => markPostAsRead(post.url)}
                                    >
                                      Read More
                                    </a>
                                    {isFavorite && <span className="text-xs opacity-50">⭐ Favorited</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredPatchPosts.map((post, index) => {
                            const category = getPostCategory(post);
                            const isRead = readPosts.has(post.url);
                            const isFavorite = favoritePosts.has(post.url);
                            
                            return (
                              <div key={post.url} className={`flex gap-4 p-4 rounded-xl glass border transition-all hover:shadow-md ${isRead ? 'border-white/5 opacity-75' : 'border-white/10 hover:border-primary/30'}`}>
                                {/* Timeline Indicator */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${category === 'patch-notes' ? 'bg-primary' : category === 'community' ? 'bg-secondary' : 'bg-accent'}`}></div>
                                  {index < filteredPatchPosts.length - 1 && <div className="w-px h-full bg-white/10 mt-2"></div>}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-sm">{post.title}</h4>
                                      <span className={`badge badge-xs ${category === 'patch-notes' ? 'badge-primary' : category === 'community' ? 'badge-secondary' : 'badge-accent'}`}>
                                        {category === 'patch-notes' ? 'Patch' : category === 'community' ? 'Community' : 'Dev Blog'}
                                      </span>
                                      {!isRead && <span className="badge badge-xs badge-info">New</span>}
                                      {isFavorite && <span className="text-xs">⭐</span>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button 
                                        className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                                        onClick={() => toggleFavoritePost(post.url)}
                                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                      >
                                        ⭐
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {post.published_at && (
                                    <div className="text-xs opacity-60 mb-2">
                                      {new Date(post.published_at).toLocaleDateString('en-US', { 
                                        weekday: 'short',
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                  
                                  {post.excerpt && (
                                    <p className="text-xs opacity-80 mb-3 line-clamp-2">{post.excerpt}</p>
                                  )}
                                  
                                  <a 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-xs btn-outline"
                                    onClick={() => markPostAsRead(post.url)}
                                  >
                                    Read Full Article →
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {filteredPatchPosts.length === 0 && !patchLoading && (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">📰</div>
                          <h4 className="text-lg font-semibold mb-2">No posts found</h4>
                          <p className="text-sm opacity-70 mb-4">
                            {patchNotesSearch.trim() 
                              ? `No posts match "${patchNotesSearch}"`
                              : `No ${patchNotesFilter === 'all' ? '' : patchNotesFilter + ' '}posts available`
                            }
                          </p>
                          {patchNotesSearch.trim() && (
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => setPatchNotesSearch('')}
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
        )}
      </section>
          {finished && (
        <div className="fixed top-14 right-4 flex flex-col gap-2 items-end pointer-events-none z-50">
          <div className="alert alert-success toast-slide-in-tr pointer-events-auto shadow-lg">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {installPromptOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-0 grid place-items-center p-4">
          <div className="glass rounded-xl p-5 w-[560px] max-w-[92vw]">
            <div className="text-sm font-semibold mb-2">Choose install location</div>
            <div className="text-xs opacity-80 mb-3">The game will be installed inside a folder named <span className="font-mono">{selectedChannel}</span> at the path you pick.</div>
            {(() => {
              const normRoot = (launcherRoot || '').replace(/\\+$/,'').toLowerCase();
              const normBase = (installBaseDir || '').replace(/\\+$/,'').toLowerCase();
              const isLauncherFolderSelected = normRoot && normBase && normBase === normRoot;
              if (!isLauncherFolderSelected) return null;
              return (
                <div className="alert alert-warning text-xs mb-3">
                  <span>Do not select the launchers own install folder. Pick a separate base directory; the <span className="font-mono">{selectedChannel}</span> subfolder will be created automatically.</span>
                </div>
              );
            })()}
            <div className="flex items-center gap-2">
              <input className="input input-bordered input-sm w-full" value={installBaseDir} onChange={(e)=>setInstallBaseDir(e.target.value)} placeholder="Select base folder" />
              <button className="btn btn-sm" onClick={async()=>{ const picked = await window.electronAPI?.selectDirectory?.(); if (picked) setInstallBaseDir(picked); }}>Browse</button>
            </div>
            <div className="mt-3 text-xs opacity-70">Final path</div>
            <div className="mt-1 p-2 rounded bg-base-300/40 font-mono text-xs break-all">{(installBaseDir||'').replace(/\\+$/,'')}{installBaseDir ? `\\${selectedChannel}` : selectedChannel}</div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-sm btn-ghost" onClick={()=>setInstallPromptOpen(false)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={confirmInstallWithDir} disabled={!installBaseDir}>Install here</button>
            </div>
          </div>
          </div>
        </div>
      )}

      {(updateAvailable || updateDownloaded) && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="glass rounded-xl p-0 w-[640px] max-w-[92vw] overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-primary/20 to-transparent px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/40 grid place-items-center text-white">↑</div>
                <div>
                  <div className="text-sm font-semibold">Launcher update required</div>
                  <div className="text-xs opacity-80">You must update to continue using the launcher.</div>
                </div>
              </div>
              {!updateDownloaded && (
                <div className="px-5 py-4">
                  <progress className="progress w-full" value={Math.min(100, Math.max(0, updateProgress))} max={100}></progress>
                  <div className="mt-2 text-xs opacity-80 flex items-center gap-3 font-mono">
                    <span>{Math.floor(updateProgress)}%</span>
                    <span>•</span>
                    <span>{(updateBps/1024/1024).toFixed(2)} MB/s</span>
                    {updateTotal > 0 && (
                      <>
                        <span>•</span>
                        <span>{(updateTransferred/1024/1024).toFixed(1)} / {(updateTotal/1024/1024).toFixed(1)} MB</span>
                      </>
                    )}
                  </div>
                  {updateError && <div className="alert alert-error mt-3 text-xs"><span>{updateError}</span></div>}
                </div>
              )}
              {updateDownloaded && (
                <div className="px-5 py-4 flex justify-end gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => window.electronAPI?.quitAndInstall?.()}>Restart to update</button>
            </div>
          )}
        </div>
          </div>
        </div>
      )}

      {modDetailsOpen && modDetailsPack && (
        <div className="fixed inset-0 z-[55]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setModDetailsOpen(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="glass rounded-xl w-[760px] max-w-[95vw] overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-3 border-b border-white/10">
                <div className="w-14 h-14 bg-base-300/40 rounded overflow-hidden flex items-center justify-center">
                  {modDetailsPack?.versions?.[0]?.icon && (
                    <img src={modDetailsPack.versions[0].icon} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold truncate">{String(modDetailsPack?.name || modDetailsPack?.full_name || 'Mod').replace(/_/g, ' ')}</div>
                  <div className="text-xs opacity-70 truncate">Author: {modDetailsPack?.owner || (modDetailsPack?.full_name||'').split('-')[0] || 'Unknown'}</div>
                  {(() => { const latest = (Array.isArray(modDetailsPack?.versions) && modDetailsPack.versions[0]) ? modDetailsPack.versions[0] : null; if (!latest) return null; return (
                    <div className="text-xs opacity-80 mt-1 line-clamp-3">{latest.description || ''}</div>
                  ); })()}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <a className="btn btn-sm btn-ghost" href={getPackageUrlFromPack(modDetailsPack) || '#'} target="_blank" rel="noreferrer">Open on Thunderstore</a>
                  <button className="btn btn-sm btn-ghost" onClick={()=>setModDetailsOpen(false)}>Close</button>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs uppercase opacity-60 mb-2">Versions</div>
                <div className="max-h-[50vh] overflow-y-auto pr-1">
                  {(modDetailsPack?.versions || []).map((v: any, idx: number) => {
                    const installed = (installedMods || []).find(im => String(im.name||'').toLowerCase() === String(modDetailsPack?.name||'').toLowerCase());
                    const isCurrent = installed && installed.version && v?.version_number && compareVersions(installed.version, v.version_number) === 0;
                    const folderKey = sanitizeFolderName(modDetailsPack?.full_name || modDetailsPack?.name || v?.name || 'mod');
                    return (
                      <div key={v?.uuid4 || v?.full_name || v?.version_number || idx} className="flex items-center gap-3 py-2 border-b border-white/10 last:border-b-0">
                        <div className="min-w-24 text-sm">{v?.version_number || '—'}</div>
                        <div className="text-xs opacity-70 flex-1 truncate">{v?.description || ''}</div>
                        {isCurrent ? (
                          <span className="btn btn-md btn-success btn-outline pointer-events-none">Installed</span>
                        ) : (
                          <button className={`btn btn-md ${idx===0 ? 'btn-success' : 'btn-outline'} ${installingMods[folderKey]==='install'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>installSpecificVersion(modDetailsPack, v)}>
                            {installingMods[folderKey]==='install' ? 'Installing…' : (idx===0 ? 'Install latest' : 'Install')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {eulaOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="glass rounded-xl w-[900px] max-w-[95vw] max-h-[85vh] overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
                <div className="text-base font-semibold">End User License Agreement</div>
                <div className="ml-auto text-xs opacity-70">{eulaLoading ? 'Loading…' : ''}</div>
              </div>
              <div className="p-4">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[55vh] pr-2">
                  {eulaContent || 'Failed to load EULA.'}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="btn btn-ghost" onClick={()=>{ setEulaOpen(false); const r=eulaResolveRef.current; eulaResolveRef.current=null; if(r) r(false); }}>Decline</button>
                  <button className="btn btn-primary" onClick={async ()=>{ try { const ver = eulaKeyRef.current || 'latest'; const s:any = await window.electronAPI?.getSettings?.(); const next = { ...(s||{}) }; next.eulaAcceptedVersion = ver; await window.electronAPI?.setSetting?.('eulaAcceptedVersion', ver); } catch {} finally { setEulaOpen(false); const r=eulaResolveRef.current; eulaResolveRef.current=null; if(r) r(true); } }}>I Agree</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission prompt modal */}
      {permissionPromptOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="glass rounded-xl p-5 w-[560px] max-w-[92vw]">
              <div className="text-sm font-semibold mb-2">Folder Permissions Required</div>
              <div className="text-xs opacity-80 mb-4">
                To ensure the game runs properly, we need to set the correct folder permissions. 
                This requires administrator privileges and will be done automatically.
              </div>
              
              <div className="alert alert-info text-xs mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>
                  <strong>What we'll do:</strong><br />
                  • Create the installation folder if it doesn't exist<br />
                  • Set proper read/write permissions for your user account<br />
                  • Remove admin requirements for the game folder
                </span>
              </div>

              <div className="mt-3 text-xs opacity-70">Installation path</div>
              <div className="mt-1 p-2 rounded bg-base-300/40 font-mono text-xs break-all">
                {(channelsSettings?.[selectedChannel]?.installDir) || installDir}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button 
                  className="btn btn-sm btn-ghost" 
                  onClick={() => setPermissionPromptOpen(false)}
                  disabled={isFixingPermissions}
                >
                  Cancel
                </button>
                <button 
                  className={`btn btn-sm btn-primary ${isFixingPermissions ? 'loading' : ''}`}
                  onClick={confirmPermissionsAndInstall}
                  disabled={isFixingPermissions}
                >
                  {isFixingPermissions ? 'Setting Permissions...' : 'Continue & Fix Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


