import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FolderOpen } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'general'|'downloads'|'launch'|'patchnotes'|'settings'>('general');
  type PartInfo = { received: number; total: number };
  type FileInfo = { status: string; received?: number; total?: number; totalParts?: number; parts?: Record<number, PartInfo> };
  const [progressItems, setProgressItems] = useState<Record<string, FileInfo>>({});
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [finished, setFinished] = useState(false);
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
      });
      window.electronAPI?.onUpdate?.('update:downloaded', () => setUpdateDownloaded(true));
      window.electronAPI?.onUpdate?.('update:error', (_e: any) => { /* keep silent or show toast if needed */ });
      // Kick off check, non-blocking; guard missing handler
      try { window.electronAPI?.checkForUpdates?.()?.catch(() => {}); } catch {}
    } catch {}
  }, []);

  useEffect(() => {
    window.electronAPI?.getSettings()?.then((s: any) => {
      if (s?.installDir) setInstallDir(s.installDir);
      else window.electronAPI?.getDefaultInstallDir(selectedChannel || undefined).then((d) => { if (d) setInstallDir(d); });
      if (s?.concurrency) setConcurrency(Number(s.concurrency));
      if (s?.partConcurrency) setPartConcurrency(Number(s.partConcurrency));
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

  async function chooseFolder() {
    const picked = await window.electronAPI?.selectDirectory();
    if (picked) await persistDir(picked);
  }

  async function persistDir(dir: string) {
    setInstallDir(dir);
    try {
      const s: any = await window.electronAPI?.getSettings();
      const channels = { ...(s?.channels || {}) };
      channels[selectedChannel] = { ...(channels[selectedChannel] || {}), installDir: dir };
      await window.electronAPI?.setSetting('channels', channels);
    } catch {}
  }

  async function startInstall() {
    if (!channel || !installDir) return;
    setBusy(true);
    setFinished(false);
    setProgressItems({});
    setDoneCount(0);
    setTotalCount(0);
    try {
      const checksums = await window.electronAPI!.fetchChecksums(channel.game_url);
      const filtered = (checksums.files || []).filter((f: any) => includeOptional || !f.optional);
      setTotalCount(filtered.length);
      setDoneCount(0);
      window.electronAPI!.onProgress('progress:start', (p: any) => { setOverall(p); setHasStarted(true); });
      window.electronAPI!.onProgress('progress:bytes:total', (p: any) => { const tot = Math.max(0, Number(p.totalBytes || 0)); setBytesTotal(tot); bytesTotalRef.current = tot; setBytesReceived(0); bytesReceivedRef.current = 0; setSpeedBps(0); setEtaSeconds(0); setHasStarted(true); setReceivedAnyBytes(false); });
      {
        let windowBytes = 0;
        let lastTick = Date.now();
        const tick = () => {
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
        window.electronAPI!.onProgress('progress:bytes', (p: any) => {
          const d = Number(p?.delta || 0);
          if (d !== 0) {
            setBytesReceived((x) => { const nx = Math.max(0, x + d); bytesReceivedRef.current = nx; return nx; });
            if (d > 0) windowBytes += d; else windowBytes = Math.max(0, windowBytes + d);
            if (d > 0) setReceivedAnyBytes(true);
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
      window.electronAPI!.onProgress('progress:merge:start', (p: any) => {
        setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 });
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.parts} parts`, parts: {}, totalParts: 0 }
        }));
      });
      window.electronAPI!.onProgress('progress:merge:part', (p: any) => {
        setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts });
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: `merging ${p.part+1}/${p.totalParts}`, parts: {}, totalParts: 0 }
        }));
      });
      window.electronAPI!.onProgress('progress:merge:done', (p: any) => {
        setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 });
        setProgressItems((prev) => ({
          ...prev,
          [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 }
        }));
      });
      window.electronAPI!.onProgress('progress:verify', (p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'verifying', parts: {}, totalParts: 0 } })); });
      window.electronAPI!.onProgress('progress:skip', (p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { ...(prev[p.path]||{}), status: 'skipped', parts: {}, totalParts: 0 } })); if (fileProgress?.path?.startsWith(p.path)) setFileProgress(null); });
      window.electronAPI!.onProgress('progress:error', (p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { status: `error: ${p.message}` } })); });
      window.electronAPI!.onProgress('progress:done', (p: any) => { setOverall(p); setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); setDoneCount((x) => x + 1); if (fileProgress?.path?.startsWith(p.path)) setFileProgress(null); });
      await window.electronAPI!.downloadAll({ baseUrl: channel.game_url, checksums, installDir, includeOptional, concurrency, partConcurrency, channelName: channel.name });
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
    if (!videoFilename) {
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
  const bgVideo = videoSrc || undefined;

  useEffect(() => {
    (async () => {
      if (!channel) return;
      try {
        const j = await window.electronAPI!.fetchChecksums(channel.game_url);
        setRemoteVersion(String(j?.game_version || ''));
      } catch { setRemoteVersion(null); }
    })();
  }, [channel?.game_url]);

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
          const exists = await window.electronAPI?.exists?.(ch.installDir);
          setIsInstalled(Boolean(exists));
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
      setFinished(true);
      // Update local install state so primary button flips to Play/reflects new version
      setInstalledVersion(String(checksums?.game_version || ''));
      setIsInstalled(true);
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

  return (
    <div className="h-full grid grid-cols-[88px_1fr] relative">
      <aside className="glass-soft sticky top-0 h-full flex flex-col items-center py-4 gap-4 border-r border-white/5">
        <div className="w-18 h-18 rounded-xl grid place-items-center overflow-hidden">
          <img src="/favicon.svg" alt="R5 Valkyrie" className="w-16 h-16 object-contain" />
        </div>
      </aside>

      <section className="relative overflow-y-auto bg-[#171b20]">
        <div className="mx-6 mt-4 mb-8 flex justify-center">
          <div className="tabs tabs-boxed glass-soft rounded-[2.3vw]">
            <a className={`tab ${activeTab==='general'?'tab-active':''}`} onClick={() => setActiveTab('general')}>General</a>
            <a className={`tab ${activeTab==='downloads'?'tab-active':''}`} onClick={() => setActiveTab('downloads')}>Downloads</a>
            <a className={`tab ${activeTab==='launch'?'tab-active':''}`} onClick={() => setActiveTab('launch')}>Launch Options</a>
            <a className={`tab ${activeTab==='patchnotes'?'tab-active':''}`} onClick={() => setActiveTab('patchnotes')}>Patch Notes</a>
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
                    <button className="btn btn-lg btn-primary text-white shadow-lg rounded-[1.5vw]" disabled={busy} onClick={startInstall}>Install</button>
                  )}
                  {primaryAction === 'update' && (
                    <button className="btn btn-lg btn-warning text-white shadow-lg rounded-[1.5vw]" disabled={busy} onClick={() => repairChannel(selectedChannel)}>Update</button>
                  )}
                  {primaryAction === 'play' && (
                    <button className="btn btn-lg btn-error btn-wide text-white shadow-lg shadow-error/20 rounded-[1.5vw]" onClick={async ()=>{
                      const s: any = await window.electronAPI?.getSettings();
                      const dir = s?.channels?.[selectedChannel]?.installDir || installDir;
                      const lo = s?.launchOptions?.[selectedChannel] || {};
                      const args = buildLaunchParameters();
                      const res = await window.electronAPI?.launchGame?.({ channelName: selectedChannel, installDir: dir, mode: lo?.mode || launchMode, argsString: args });
                      if (res && !res.ok) {
                        console.error('Failed to launch', res.error);
                      }
                    }}>Play</button>
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
          <img src="r5v_bannerCharacters.png" alt="" className="absolute inset-x-6 bottom-0 w-[calc(100%-3rem)] h-[300px] object-contain object-bottom origin-bottom transform scale-[1.1] pointer-events-none" />
        </div>

        {activeTab === 'general' && null}
        {activeTab === 'settings' && (
          <div key="content-settings" className="mx-6 grid grid-cols-1 xl:grid-cols-2 gap-4 fade-in">
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <span className="text-sm opacity-80">Install to</span>
              <input className="input input-bordered input-sm w-full max-w-xl" value={installDir} onChange={(e) => persistDir(e.target.value)} placeholder="Choose folder" />
              <button className="btn btn-sm" onClick={chooseFolder}><FolderOpen size={16}/></button>
          </div>
            <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4">
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
                <input type="checkbox" className="checkbox" checked={includeOptional} onChange={(e) => setIncludeOptional(e.target.checked)} />
                <span className="label-text">Include optional files</span>
              </label>
              {channel && (
                <div className="ml-auto text-xs opacity-70 truncate">
                  Using: <span className="font-mono">{channel.game_url}</span>
                </div>
              )}
        </div>

            <div className="glass rounded-xl p-4 col-span-1 xl:col-span-2">
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'launch' && (
          <div key="content-launch" className="mx-6 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto pb-6 fade-in">
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
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={windowed} onChange={(e)=>setWindowed(e.target.checked)} /><span className="label-text">Windowed</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={borderless} onChange={(e)=>setBorderless(e.target.checked)} /><span className="label-text">Borderless</span></label>
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
                <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={noAsync} onChange={(e)=>setNoAsync(e.target.checked)} /><span className="label-text">Disable async systems</span></label>
              </div>
            </div>

            {/* Right column */}
            <div className="grid gap-4">
              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Network</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={encryptPackets} onChange={(e)=>setEncryptPackets(e.target.checked)} /><span className="label-text">Encrypt</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={randomNetkey} onChange={(e)=>setRandomNetkey(e.target.checked)} /><span className="label-text">Random key</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={queuedPackets} onChange={(e)=>setQueuedPackets(e.target.checked)} /><span className="label-text">Queued pkts</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={noTimeout} onChange={(e)=>setNoTimeout(e.target.checked)} /><span className="label-text">No timeout</span></label>
                </div>
              </div>

              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Console & Playlist</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={showConsole} onChange={(e)=>setShowConsole(e.target.checked)} /><span className="label-text">Console</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={colorConsole} onChange={(e)=>setColorConsole(e.target.checked)} /><span className="label-text">ANSI color</span></label>
                </div>
                <label className="form-control flex flex-col">
                  <span className="label-text text-xs opacity-70">Playlist file (string)</span>
                  <input className="input input-bordered input-sm w-full mt-1" value={playlistFile} onChange={(e)=>setPlaylistFile(e.target.value)} placeholder="playlists_r5_patch.txt" />
                </label>
        </div>

              <div className="glass rounded-xl p-4 grid gap-3">
                <div className="text-xs uppercase opacity-60">Gameplay & Advanced</div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={enableDeveloper} onChange={(e)=>setEnableDeveloper(e.target.checked)} /><span className="label-text">Developer</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={enableCheats} onChange={(e)=>setEnableCheats(e.target.checked)} /><span className="label-text">Cheats</span></label>
                  <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={offlineMode} onChange={(e)=>setOfflineMode(e.target.checked)} /><span className="label-text">Offline</span></label>
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
          <div key={`content-main-${activeTab}`} className="mx-6 mt-4 grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-4 items-start pb-6 fade-in">
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
            <div className="space-y-3">
              {activeTab === 'general' && (busy && (hasStarted || overall)) && (
                <div className="glass rounded-xl p-4">
                  {(() => {
                    const trackingByBytes = receivedAnyBytes && bytesTotal > 0;
                    let percent: number;
                    if (trackingByBytes) {
                      percent = (bytesReceived / (bytesTotal || 1)) * 100;
                    } else if (overall && typeof overall.total === 'number') {
                      const completedSoFar = typeof overall.completed === 'number' ? overall.completed : (overall.index + 1);
                      percent = (completedSoFar / (overall.total || 1)) * 100;
                    } else {
                      percent = totalCount > 0 ? ((doneCount / totalCount) * 100) : 0;
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
                <div className="glass rounded-xl p-4 max-h-64 overflow-y-auto">
                  {Object.entries(progressItems).length > 0 ? Object.entries(progressItems).map(([p, info]) => {
              const percent = info.total ? Math.floor(((info.received || 0) / (info.total || 1)) * 100) : undefined;
                    const parts = info.parts || {};
                    const totalParts = info.totalParts || Object.keys(parts).length || 0;
              return (
                      <div key={p} className="py-2">
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
                                <div key={`${p}-part-${i}`} className="text-xs mb-1">
                                  <div className="flex items-center justify-between">
                                    <span className="opacity-70">Part {i+1}/{totalParts}</span>
                                    <span className="opacity-60">{pcent}%</span>
                                  </div>
                                  <progress className="progress progress-secondary w-full mt-1" value={pcent} max={100}></progress>
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

          {finished && (
              <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-50">
                <div className="alert alert-success toast-slide-in pointer-events-auto">
                  <span>Completed</span>
                </div>
              </div>
            )}

            


            {activeTab === 'patchnotes' && (
              <div className="glass rounded-xl p-4 min-h-[220px] xl:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Patch Notes — {selectedChannel}</h3>
                  <a className="link link-hover text-xs opacity-70" href={`https://blog.playvalkyrie.org/tag/${(selectedChannel || '').toLowerCase()}-patch-notes/`} target="_blank" rel="noreferrer">View all</a>
                </div>
                {patchLoading && (
                  <div className="text-xs opacity-70">Loading…</div>
                )}
                {!patchLoading && (
                  <div className="grid gap-3">
                    {(patchPosts || []).map((p) => (
                      <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[80px_1fr] gap-3 items-center hover:bg-white/5 rounded-md p-2">
                        <div className="w-20 h-16 rounded-md bg-base-300 overflow-hidden border border-white/10">
                          {p.feature_image ? (
                            <img src={p.feature_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-xs opacity-60">No image</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate group-hover:text-primary">{p.title}</div>
                          {p.published_at && (
                            <div className="text-[10px] opacity-60">{new Date(p.published_at).toLocaleDateString()}</div>
                          )}
                          {p.excerpt && (
                            <div className="text-xs opacity-70 line-clamp-2">{p.excerpt}</div>
                          )}
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
                  <h3 className="text-sm font-semibold">Community News</h3>
                  <a className="link link-hover text-xs opacity-70" href="https://blog.playvalkyrie.org/tag/community/" target="_blank" rel="noreferrer">View all</a>
                </div>
                {newsLoading && (
                  <div className="text-xs opacity-70">Loading…</div>
                )}
                {!newsLoading && (
                  <div className="grid gap-3">
                    {(newsPosts || []).map((p) => (
                      <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[80px_1fr] gap-3 items-center hover:bg-white/5 rounded-md p-2">
                        <div className="w-20 h-16 rounded-md bg-base-300 overflow-hidden border border-white/10">
                          {p.feature_image ? (
                            <img src={p.feature_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-xs opacity-60">No image</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate group-hover:text-primary">{p.title}</div>
                          {p.published_at && (
                            <div className="text-[10px] opacity-60">{new Date(p.published_at).toLocaleDateString()}</div>
                          )}
                          {p.excerpt && (
                            <div className="text-xs opacity-70 line-clamp-2">{p.excerpt}</div>
                          )}
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
    </div>
  );
}


