import React, { useEffect, useMemo, useRef, useState } from 'react';
 

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
      // Mods
      listInstalledMods?: (installDir: string) => Promise<{ok:boolean; mods?: any[]; error?: string}>;
      setModEnabled?: (installDir: string, name: string, enabled: boolean) => Promise<{ok:boolean; error?: string}>;
      uninstallMod?: (installDir: string, folder: string) => Promise<{ok:boolean; error?: string}>;
      fetchAllMods?: (query?: string) => Promise<{ok:boolean; mods?: any[]; error?: string}>;
      installMod?: (installDir: string, name: string, downloadUrl: string) => Promise<{ok:boolean; error?: string}>;
      onModsProgress?: (listener: (payload: any) => void) => void;
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
  const [includeOptional, setIncludeOptional] = useState(false);
  const [concurrency, setConcurrency] = useState<number>(4);
  const [partConcurrency, setPartConcurrency] = useState<number>(4);
  const [bannerVideoEnabled, setBannerVideoEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'general'|'downloads'|'launch'|'patchnotes'|'mods'|'settings'>('general');
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
  const [modsSubtab, setModsSubtab] = useState<'installed'|'all'>('installed');
  const [installedMods, setInstalledMods] = useState<InstalledMod[] | null>(null);
  const [installedModsLoading, setInstalledModsLoading] = useState(false);
  const [allMods, setAllMods] = useState<any[] | null>(null);
  const [allModsLoading, setAllModsLoading] = useState(false);
  const [modsQuery, setModsQuery] = useState('');
  const [modsError, setModsError] = useState<string | null>(null);
  const [modsRefreshNonce, setModsRefreshNonce] = useState(0);
  const [installingMods, setInstallingMods] = useState<Record<string, 'install'|'uninstall'|undefined>>({});
  const [modProgress, setModProgress] = useState<Record<string, { received: number; total: number; phase: string }>>({});
  // News posts
  type NewsPost = { title: string; excerpt?: string; published_at?: string; url: string; feature_image?: string };
  const [newsPosts, setNewsPosts] = useState<NewsPost[] | null>(null);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);
  const [patchPosts, setPatchPosts] = useState<NewsPost[] | null>(null);
  const [patchLoading, setPatchLoading] = useState<boolean>(false);
  // Launch options state
  type LaunchMode = 'HOST'|'SERVER'|'CLIENT';
  const [launchMode, setLaunchMode] = useState<LaunchMode>('HOST');
  const [hostname, setHostname] = useState<string>('');
  const [visibility, setVisibility] = useState<number>(0);
  const [windowed, setWindowed] = useState<boolean>(false);
  const [borderless, setBorderless] = useState<boolean>(false);
  const [maxFps, setMaxFps] = useState<string>('0');
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
    await startInstall();
  }

  async function startInstall() {
    if (!channel || !installDir) return;
    setBusy(true);
    setFinished(false);
    setProgressItems({});
    setDoneCount(0);
    setTotalCount(0);
    const runId = Date.now();
    runIdRef.current = runId;
    try {
      const checksums = await window.electronAPI!.fetchChecksums(channel.game_url);
      const filtered = (checksums.files || []).filter((f: any) => includeOptional || !f.optional);
      setTotalCount(filtered.length);
      setDoneCount(0);
      const guard = (fn: (x:any)=>void) => (payload: any) => { if (runIdRef.current !== runId) return; fn(payload); };
      window.electronAPI!.onProgress('progress:start', guard((p: any) => { setOverall(p); setHasStarted(true); }));
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
      window.electronAPI!.onProgress('progress:verify', guard((p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); }));
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
      await window.electronAPI!.downloadAll({ baseUrl: channel.game_url, checksums, installDir, includeOptional, concurrency, partConcurrency, channelName: channel.name });
      setToastMessage('Install completed');
      setFinished(true);
      // Update local install state so primary button flips to Play
      setInstalledVersion(String(checksums?.game_version || ''));
      setIsInstalled(true);
      setChannelsSettings((prev) => ({
        ...prev,
        [channel.name]: {
          ...(prev?.[channel.name] || {}),
          installDir,
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
        const res = await window.electronAPI?.listInstalledMods?.(installDir || '');
        setInstalledMods(res?.ok ? (res?.mods || []) : []);
      } catch { setInstalledMods([]); } finally { setInstalledModsLoading(false); }
    })();
  }, [activeTab, installDir]);

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
    finally { setInstallingMods((s) => { const n = { ...s }; const k = (mod?.name || (mod?.full_name?.split('-')?.[0]) || 'mod').replace(/[\\/:*?"<>|]/g, '_'); delete n[k]; return n; }); }
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

  function getLatestVersionForName(name?: string): string | null {
    const needle = String(name || '').toLowerCase();
    const pack = (allMods || []).find((p: any) => String(p?.name||'').toLowerCase() === needle);
    const latest = Array.isArray(pack?.versions) && pack.versions[0] ? pack.versions[0] : null;
    return latest?.version_number || null;
  }

  function getPackByName(name?: string): any | null {
    const needle = String(name || '').toLowerCase();
    const pack = (allMods || []).find((p: any) => String(p?.name||'').toLowerCase() === needle);
    return pack || null;
  }

  function sanitizeFolderName(s: string): string {
    return String(s || 'mod').replace(/[\\/:*?"<>|]/g, '_');
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
          setMaxFps(String(lo.maxFps ?? '0'));
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
        const tag = `${(selectedChannel || '').toLowerCase()}-patch-notes`;
        const url = `https://blog.playvalkyrie.org/ghost/api/content/posts/?key=4d046cff94d3fdfeaab2bf9ccf&include=tags,authors&filter=tag:${encodeURIComponent(tag)}&limit=10&fields=title,excerpt,published_at,url,feature_image`;
        const resp = await fetch(url);
        const json = await resp.json();
        const posts = Array.isArray(json?.posts) ? json.posts : [];
        setPatchPosts(posts);
      } catch {
        setPatchPosts([]);
      } finally {
        setPatchLoading(false);
      }
    };
    if (activeTab === 'patchnotes' && selectedChannel) loadPatch();
  }, [activeTab, selectedChannel]);
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
    params.push(`+fps_max ${/^-?\d+$/.test(maxFps) ? maxFps : '0'}`);
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

  async function repairChannel(name: string) {
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
      window.electronAPI!.onProgress('progress:start', (p: any) => { setOverall(p); setHasStarted(true); });
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
      window.electronAPI!.onProgress('progress:merge:start', (p: any) => { setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:merge:part', (p: any) => { setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.part+1}/${p.totalParts}`, parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:merge:done', (p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:verify', (p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:skip', (p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'skipped', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:done', (p: any) => { setOverall(p); setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); setDoneCount((x) => x + 1); });
      await window.electronAPI!.downloadAll({ baseUrl: target.game_url, checksums, installDir: dir, includeOptional, concurrency, partConcurrency, channelName: name });
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

  return (
    <div className="h-full grid grid-cols-[88px_1fr] relative">
      <aside className="sticky top-0 h-full flex flex-col items-center py-4 gap-4 border-r border-white/5">
        <div className="w-16 h-16 grid place-items-center overflow-hidden glass-soft">
          <img src="logo.png" alt="R5 Valkyrie" className="w-12 h-12 object-contain" />
        </div>
      </aside>

      <section className="relative overflow-y-scroll overlay-scroll bg-[#171b20]">
        <div className="mx-6 mt-4 mb-8 flex justify-center">
          <div className="tabs tabs-boxed glass-soft rounded-[2.3vw]">
                <a className={`tab ${activeTab==='general'?'tab-active':''}`} onClick={() => setActiveTab('general')}>General</a>
            <a className={`tab ${activeTab==='downloads'?'tab-active':''}`} onClick={() => setActiveTab('downloads')}>Downloads</a>
            <a className={`tab ${activeTab==='launch'?'tab-active':''}`} onClick={() => setActiveTab('launch')}>Launch Options</a>
                <a className={`tab ${activeTab==='patchnotes'?'tab-active':''}`} onClick={() => setActiveTab('patchnotes')}>Patch Notes</a>
            <a className={`tab ${activeTab==='mods'?'tab-active':''}`} onClick={() => setActiveTab('mods')}>Mods</a>
            <a className={`tab ${activeTab==='settings'?'tab-active':''}`} onClick={() => setActiveTab('settings')}>Settings</a>
              </div>
            </div>
        <div className="relative mx-6 mt-12 mb-6 overflow-visible">
          <div className="relative h-[250px] rounded-[2.3vw] overflow-hidden">
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
                    <button className="btn btn-lg btn-primary text-white shadow-lg rounded-[1.5vw]" disabled={busy} onClick={openInstallPrompt}>Install</button>
                  )}
                  {primaryAction === 'update' && (
                    <button className="btn btn-lg btn-warning text-white shadow-lg rounded-[1.5vw]" disabled={busy} onClick={() => repairChannel(selectedChannel)}>Update</button>
                  )}
                  {primaryAction === 'play' && (
                    <button className="btn btn-lg btn-error btn-wide text-white shadow-lg shadow-error/20 rounded-[1.5vw]" disabled={busy} onClick={async ()=>{
                      if (busy) return;
                      const s: any = await window.electronAPI?.getSettings();
                      const dir = s?.channels?.[selectedChannel]?.installDir || installDir;
                      const lo = s?.launchOptions?.[selectedChannel] || {};
                      const args = buildLaunchParameters();
                      const res = await window.electronAPI?.launchGame?.({ channelName: selectedChannel, installDir: dir, mode: lo?.mode || launchMode, argsString: args });
                      if (res && !res.ok) {
                        console.error('Failed to launch', res.error);
                      }
                    }}>{busy ? 'Working…' : 'Play'}</button>
                  )}
                  <button className="btn btn-lg rounded-[1.5vw]" title="Settings" onClick={() => setActiveTab('settings')}>⚙</button>
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
              {[1,2,3,4,6,8,12,16].map((n) => (
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
              {[1,2,3,4,6,8,12,16].map((n) => (
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

            <div className="glass rounded-xl p-4 col-span-1 xl:col-span-2 mb-4">
              <div className="mb-3 text-sm opacity-80">Repair installed channels</div>
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
                      <button className="btn btn-sm" disabled={!dir || busy} onClick={() => repairChannel(c.name)}>Repair</button>
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
              {activeTab === 'mods' && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="btn-group">
                      <button className={`btn btn-md ${modsSubtab==='installed'?'btn-active btn-primary':''}`} onClick={()=>setModsSubtab('installed')}>Installed</button>
                      <button className={`btn btn-md ${modsSubtab==='all'?'btn-active btn-primary':''}`} onClick={()=>setModsSubtab('all')}>All</button>
                    </div>
                    <div className="flex items-center gap-2">
                      {modsSubtab === 'all' && (
                        <input className="input input-bordered input-sm w-64" placeholder="Search mods" value={modsQuery} onChange={(e)=>setModsQuery(e.target.value)} />
                      )}
                      <button className="btn btn-sm btn-primary" title="Refresh" onClick={()=> setModsRefreshNonce((x)=>x+1)}>↻</button>
                    </div>
                  </div>

                  {modsSubtab === 'installed' && (
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {installedModsLoading && <div className="text-xs opacity-70">Loading…</div>}
                      {!installedModsLoading && (installedMods||[]).map((m) => (
                        <div key={m.name} className="glass-soft rounded-lg border border-white/10 overflow-hidden relative">
                          <div className="flex items-stretch min-h-[96px]">
                            <div className="w-28 bg-base-300/40 flex items-center justify-center overflow-hidden">
                              {m as any && (m as any).iconDataUrl ? (
                                <img src={(m as any).iconDataUrl} alt="" className="w-full h-full object-cover" />
                              ) : getModIconUrl(m.name || m.id) ? (
                                <img src={getModIconUrl(m.name || m.id)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                            <div className="flex-1 p-3 flex flex-col">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{m.name || m.id}</div>
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
                                    <button className={`btn btn-md btn-error ${(!m.hasManifest || installingMods[key]==='uninstall')?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>uninstallMod(m)} disabled={!m.hasManifest}>
                                       🗑
                                    </button>
                                  ); })()}
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
                      {!installedModsLoading && (installedMods||[]).length===0 && (
                        <div className="text-xs opacity-70">No mods installed.</div>
                      )}
                    </div>
                  )}

                  {modsSubtab === 'all' && (
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {allModsLoading && <div className="text-xs opacity-70">Loading…</div>}
                      {(!allModsLoading && modsError) && <div className="text-xs opacity-80 text-warning">{modsError}</div>}
                      {!allModsLoading && (allMods||[]).slice(0, 60).map((m:any) => {
                        const latest = Array.isArray(m?.versions) && m.versions[0] ? m.versions[0] : null;
                        const title = m?.name || (m?.full_name?.split('-')?.[0]) || 'Unknown';
                        const ver = latest?.version_number || '';
                        const installed = (installedMods || []).find((im) => String(im.name || '').toLowerCase() === String(m?.name || '').toLowerCase());
                        const state = installed ? (compareVersions(installed?.version || null, ver) < 0 ? 'update' : 'installed') : 'not';
                        const key = sanitizeFolderName(m?.full_name || m?.name || title);
                        return (
                          <div key={m?.uuid4 || m?.full_name || title} className="glass-soft rounded-lg border border-white/10 overflow-hidden relative">
                            <div className="flex items-stretch min-h-[96px]">
                              <div className="w-28 bg-base-300/40 flex items-center justify-center overflow-hidden">
                                {m?.versions?.[0]?.icon && (
                                  <img src={m.versions[0].icon} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 p-3 pb-5 flex items-start">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate flex items-center gap-2">
                                    <span className="truncate">{title}</span>
                                    {(state === 'installed' || state === 'update') && (<span className="badge badge-success">Installed</span>)}
                                  </div>
                                  <div className="text-[11px] opacity-60 truncate">{ver}</div>
                                  {m?.versions?.[0]?.description && (
                                    <div className="text-xs opacity-70 mt-2 line-clamp-2">{m.versions[0].description}</div>
                                  )}
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  {state === 'not' && (
                                    <button className={`btn btn-md btn-success ${installingMods[key]==='install'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>installFromAll(m)} disabled={!!installingMods[key]}> 
                                      {installingMods[key]==='install' ? 'Installing…' : 'Install'}
                                    </button>
                                  )}
                                  {state === 'installed' && (
                                    <button className={`btn btn-md btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>uninstallFromAll(m)}>
                                      🗑
                                    </button>
                                  )}
                                  {state === 'update' && (
                                    <>
                                      <button className={`btn btn-md btn-warning ${installingMods[key]==='install'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>updateFromAll(m)}>
                                        {installingMods[key]==='install' ? 'Updating…' : 'Update'}
                                      </button>
                                      <button className={`btn btn-md btn-error ${installingMods[key]==='uninstall'?'btn-disabled pointer-events-none opacity-60':''}`} onClick={()=>uninstallFromAll(m)}>
                                        🗑
                                      </button>
                                    </>
                                  )}
                                  <button className="btn btn-md btn-ghost" title="View details" onClick={()=>openModDetails(m)}>Details</button>
                                </div>
                              </div>
                            </div>
                            {installingMods[key]==='install' && (
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
                            )}
                          </div>
                        );
                      })}
                      {!allModsLoading && (allMods||[]).length===0 && (
                        <div className="text-xs opacity-70">No mods found.</div>
                      )}
                    </div>
                  )}
                  <div className="text-[10px] opacity-60 mt-3">Mods powered by <a className="link" href="https://thunderstore.io/c/r5valkyrie" target="_blank" rel="noreferrer">Thunderstore</a></div>
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
                        <progress className="progress w-full" value={percent} max={100}></progress>
                        <div className="mt-2 text-xs opacity-80 flex items-center gap-3 font-mono">
                          {trackingByBytes ? (
                            <>
                              <span>{Number(percent).toFixed(1)}%</span>
                              <span>•</span>
                              <span>{(speedBps/1024/1024).toFixed(2)} MB/s</span>
                              <span>•</span>
                              <span>ETA {etaSeconds > 0 ? `${Math.floor(etaSeconds/60)}m ${etaSeconds%60}s` : '—'}</span>
                            </>
                          ) : (
                            <>
                              <span>
                                Checking files… {checkedNumerator}/{checkedDenominator}
                              </span>
                            </>
                          )}
                          <span className="ml-auto flex items-center gap-2">
                            {!isPaused ? (
                              <button className="btn btn-outline btn-xs" disabled={!busy} onClick={async () => { await window.electronAPI?.cancelDownload(); setIsPaused(true); }}>Pause</button>
                            ) : (
                              <button className="btn btn-outline btn-xs" onClick={async () => { setIsPaused(false); startInstall(); }}>Resume</button>
                            )}
                            <button className="btn btn-outline btn-xs" disabled={!busy} onClick={async () => { await window.electronAPI?.cancelDownload(); setHasStarted(false); setBytesReceived(0); setSpeedBps(0); setEtaSeconds(0); setProgressItems({}); }}>Cancel</button>
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

            


            {activeTab === 'patchnotes' && (
              <div className="glass rounded-xl p-4 min-h-[220px] xl:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Patch Notes — {selectedChannel}</h3>
                    {!!(patchPosts && patchPosts.length) && (
                      <span className="badge badge-ghost text-[10px]">{patchPosts.length}</span>
                    )}
                  </div>
                  <a className="btn btn-xs btn-ghost" href={`https://blog.playvalkyrie.org/tag/${(selectedChannel || '').toLowerCase()}-patch-notes/`} target="_blank" rel="noreferrer">View all</a>
                </div>
                {patchLoading && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`ps-${i}`} className="glass-soft rounded-xl overflow-hidden border border-white/10 animate-pulse">
                        <div className="w-full pb-[40%] bg-base-300/50" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 bg-base-300/60 rounded w-3/4" />
                          <div className="h-3 bg-base-300/40 rounded w-11/12" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!patchLoading && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {(patchPosts || []).slice(0, 8).map((p) => (
                      <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden glass border border-white/10 hover:border-primary/40 transition-all hover:shadow-lg">
                        <div className="relative w-full pb-[40%] bg-base-300">
                          {p.feature_image ? (
                            <img loading="lazy" src={p.feature_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-xs opacity-60">No image</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                          <div className="absolute left-0 top-0 h-full w-1 bg-primary/60" />
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-semibold truncate">{p.title}</div>
                          <div className="flex items-center gap-2 text-[10px] opacity-60 mt-0.5">
                            {p.published_at && <span>{new Date(p.published_at).toLocaleDateString()}</span>}
                          </div>
                          {p.excerpt && (
                            <div className="text-xs opacity-80 line-clamp-2 mt-1">{p.excerpt}</div>
                          )}
                          <div className="mt-2 flex justify-end">
                            <span className="btn btn-xs btn-outline">Open notes</span>
                          </div>
                        </div>
                      </a>
                    ))}
                    {patchPosts && patchPosts.length === 0 && (
                      <div className="text-xs opacity-70">No patch notes found for {selectedChannel}.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'general' && (
              <div className="glass rounded-xl p-4 min-h-[220px] xl:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Community News</h3>
                    {!!(newsPosts && newsPosts.length) && (
                      <span className="badge badge-ghost text-[10px]">{newsPosts.length}</span>
                    )}
                  </div>
                  <a className="btn btn-xs btn-ghost" href="https://blog.playvalkyrie.org/tag/community/" target="_blank" rel="noreferrer">View all</a>
                </div>
                {newsLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`s-${i}`} className="glass-soft rounded-xl overflow-hidden border border-white/10 animate-pulse">
                        <div className="w-full pb-[45%] bg-base-300/50" />
                        <div className="p-2 space-y-2">
                          <div className="h-3 bg-base-300/60 rounded w-3/4" />
                          <div className="h-3 bg-base-300/40 rounded w-10/12" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!newsLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {(newsPosts || []).slice(0, 9).map((p) => (
                      <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden glass-soft border border-white/10 hover:border-primary/30 transition-all hover:shadow-lg">
                        <div className="relative w-full pb-[45%] bg-base-300">
                          {p.feature_image ? (
                            <img loading="lazy" src={p.feature_image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-xs opacity-60">No image</div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        <div className="p-2">
                          <div className="text-[13px] font-medium truncate group-hover:text-primary">{p.title}</div>
                          <div className="flex items-center gap-2 text-[10px] opacity-60 mt-0.5">
                            {p.published_at && <span>{new Date(p.published_at).toLocaleDateString()}</span>}
                          </div>
                          {p.excerpt && (
                            <div className="text-xs opacity-80 line-clamp-2 mt-1">{p.excerpt}</div>
                          )}
                          <div className="mt-2 flex justify-end">
                            <span className="link link-hover text-xs opacity-80">Read</span>
                          </div>
                        </div>
                      </a>
                    ))}
                    {newsPosts && newsPosts.length === 0 && (
                      <div className="text-xs opacity-70">No posts found.</div>
                    )}
                  </div>
                )}
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
                  <div className="text-base font-semibold truncate">{modDetailsPack?.name || modDetailsPack?.full_name || 'Mod'}</div>
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
    </div>
  );
}


