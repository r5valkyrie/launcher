import React, { useEffect, useMemo, useState } from 'react';
import { Home, Settings, Download, Wrench, FolderOpen, Info } from 'lucide-react';

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
    };
  }
}

const CONFIG_URL = 'https://blaze.playvalkyrie.org/config.json';

export default function LauncherUI() {
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [installDir, setInstallDir] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [overall, setOverall] = useState<{index:number,total:number,path:string}|null>(null);
  const [fileProgress, setFileProgress] = useState<{path:string,received:number,total:number}|null>(null);
  const [includeOptional, setIncludeOptional] = useState(false);
  const [concurrency, setConcurrency] = useState<number>(4);
  const [partConcurrency, setPartConcurrency] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<'general'|'patchnotes'|'settings'>('general');
  const [progressItems, setProgressItems] = useState<Record<string, {status:string; received?:number; total?:number}>>({});
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [finished, setFinished] = useState(false);

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

  async function chooseFolder() {
    const picked = await window.electronAPI?.selectDirectory();
    if (picked) setInstallDir(picked);
  }

  async function persistDir(dir: string) {
    setInstallDir(dir);
    await window.electronAPI?.setSetting('installDir', dir);
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
      window.electronAPI!.onProgress('progress:start', (p: any) => setOverall(p));
      window.electronAPI!.onProgress('progress:file', (p: any) => { setFileProgress(p); setProgressItems((prev) => ({ ...prev, [p.path]: { status: 'downloading', received: p.received, total: p.total } })); });
      window.electronAPI!.onProgress('progress:part', (p: any) => { setFileProgress({ path: `${p.path} (part ${p.part+1}/${p.totalParts})`, received: p.received, total: p.total }); setProgressItems((prev) => ({ ...prev, [p.path]: { status: `downloading part ${p.part+1}/${p.totalParts}`, received: p.received, total: p.total } })); });
      window.electronAPI!.onProgress('progress:merge:start', (p: any) => { setFileProgress({ path: `${p.path} (merging ${p.parts} parts)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { status: `merging ${p.parts} parts` } })); });
      window.electronAPI!.onProgress('progress:merge:part', (p: any) => { setFileProgress({ path: `${p.path} (merging part ${p.part+1}/${p.totalParts})`, received: p.part+1, total: p.totalParts }); setProgressItems((prev) => ({ ...prev, [p.path]: { status: `merging ${p.part+1}/${p.totalParts}` } })); });
      window.electronAPI!.onProgress('progress:verify', (p: any) => { setFileProgress({ path: `${p.path} (verifying)`, received: 0, total: 1 }); setProgressItems((prev) => ({ ...prev, [p.path]: { status: 'verifying' } })); });
      window.electronAPI!.onProgress('progress:skip', (p: any) => { setProgressItems((prev) => ({ ...prev, [p.path]: { status: 'skipped' } })); setDoneCount((x) => x + 1); });
      window.electronAPI!.onProgress('progress:done', (p: any) => { setOverall(p); setProgressItems((prev) => { const next = { ...prev }; delete next[p.path]; return next; }); setDoneCount((x) => x + 1); });
      await window.electronAPI!.downloadAll({ baseUrl: channel.game_url, checksums, installDir, includeOptional, concurrency, partConcurrency });
      setFinished(true);
    } finally {
      setBusy(false);
    }
  }

  const [bgCached, setBgCached] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (config?.backgroundVideo) {
      window.electronAPI?.cacheBackgroundVideo(config.backgroundVideo).then((url: string) => setBgCached(url)).catch(() => setBgCached(undefined));
    }
  }, [config?.backgroundVideo]);
  const bgVideo = bgCached;

  return (
    <div className="min-h-[75vh] grid grid-cols-[72px_1fr] gap-0">
      <aside className="bg-base-300/60 backdrop-blur sticky top-0 h-full flex flex-col items-center py-4 gap-4">
        <button className="btn btn-ghost btn-circle" title="Home"><Home size={18}/></button>
        <button className="btn btn-ghost btn-circle" title="Downloads"><Download size={18}/></button>
        <button className="btn btn-ghost btn-circle" title="Repair"><Wrench size={18}/></button>
        <div className="mt-auto flex flex-col items-center gap-3">
          <button className="btn btn-ghost btn-circle" title="Settings" onClick={() => setActiveTab('settings')}><Settings size={18}/></button>
          <button className="btn btn-ghost btn-circle" title="About"><Info size={18}/></button>
        </div>
      </aside>

      <section className="relative overflow-hidden rounded-xl">
        <div className="relative h-72 rounded-xl overflow-hidden">
          {bgVideo ? (
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
              <source src={bgVideo} type="video/mp4" />
            </video>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"/>
          )}
          <div className="relative z-10 h-full w-full flex items-end p-6">
            <div className="flex items-center gap-4">
              <button className="btn btn-lg btn-error text-white">Play</button>
              <div className="tabs tabs-boxed">
                <a className={`tab ${activeTab==='general'?'tab-active':''}`} onClick={() => setActiveTab('general')}>General</a>
                <a className={`tab ${activeTab==='patchnotes'?'tab-active':''}`} onClick={() => setActiveTab('patchnotes')}>Patch Notes</a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Channel</span>
            <select className="select select-bordered" value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
              {config?.channels?.filter((c) => c.enabled).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Install to</span>
            <input className="input input-bordered w-96" value={installDir} onChange={(e) => persistDir(e.target.value)} placeholder="Choose folder" />
            <button className="btn" onClick={chooseFolder}><FolderOpen size={16}/></button>
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center gap-2">
          <button className="btn btn-primary" disabled={busy} onClick={startInstall}>Install</button>
          <button className="btn" disabled={busy}>Update</button>
          <button className="btn btn-outline" disabled={busy}>Repair</button>
          <label className="label cursor-pointer justify-start gap-3 ml-4">
            <input type="checkbox" className="checkbox" checked={includeOptional} onChange={(e) => setIncludeOptional(e.target.checked)} />
            <span className="label-text">Include optional files</span>
          </label>
          <div className="ml-4 flex items-center gap-2">
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
          <div className="ml-2 flex items-center gap-2">
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
        </div>

        {channel && (
          <div className="px-6 pb-4 opacity-70">
            <span className="text-sm">Using: <span className="font-mono">{channel.game_url}</span></span>
          </div>
        )}

        {overall && (
          <div className="px-6 pb-2">
            <progress className="progress w-full" value={overall.index+1} max={overall.total}></progress>
          </div>
        )}
        {fileProgress && (
          <div className="px-6 pb-2 text-sm opacity-70 font-mono">
            {fileProgress.path} — {Math.floor((fileProgress.received / (fileProgress.total||1))*100)}%
          </div>
        )}

        <div className="px-6 pb-6">
          <div className="bg-base-300 rounded-md p-3 max-h-64 overflow-y-auto">
            {Object.entries(progressItems).map(([p, info]) => {
              const percent = info.total ? Math.floor(((info.received || 0) / (info.total || 1)) * 100) : undefined;
              return (
                <div key={p} className="flex items-center justify-between text-sm py-1">
                  <span className="font-mono truncate mr-3">{p}</span>
                  <span className="opacity-70">{info.status}{percent !== undefined ? ` — ${percent}%` : ''}</span>
                </div>
              );
            })}
          </div>
          {finished && (
            <div className="mt-2 alert alert-success">
              <span>Download finished ({doneCount}/{totalCount})</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


