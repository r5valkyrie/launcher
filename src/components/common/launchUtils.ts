// Launch parameter building utilities

type LaunchMode = 'CLIENT' | 'HOST' | 'SERVER';

type LaunchOptions = {
  launchMode: LaunchMode;
  hostname: string;
  hostdesc: string;
  visibility: string;
  serverPassword: string;
  hostport: string;
  map: string;
  playlist: string;
  windowed: boolean;
  borderless: boolean;
  maxFps: string;
  resW: string;
  resH: string;
  reservedCores: string;
  workerThreads: string;
  encryptPackets: boolean;
  randomNetkey: boolean;
  queuedPackets: boolean;
  noTimeout: boolean;
  showConsole: boolean;
  colorConsole: boolean;
  playlistFile: string;
  mapIndex: string;
  playlistIndex: string;
  enableDeveloper: boolean;
  enableCheats: boolean;
  offlineMode: boolean;
  noAsync: boolean;
  discordRichPresence: boolean;
  customCmd: string;
};

export function buildLaunchParameters(options: LaunchOptions): string {
  const {
    launchMode,
    hostname,
    hostdesc,
    visibility,
    serverPassword,
    hostport,
    map,
    playlist,
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
    mapIndex,
    playlistIndex,
    enableDeveloper,
    enableCheats,
    offlineMode,
    noAsync,
    discordRichPresence,
    customCmd,
  } = options;

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
  if (mapIndex && Number(mapIndex) > 0) params.push(`+map ${mapIndex}`);
  if (playlistIndex && Number(playlistIndex) > 0) params.push(`+launchplaylist ${playlistIndex}`);
  if (enableDeveloper) params.push('-dev -devsdk');
  if (enableCheats) params.push('+sv_cheats 1');
  if (offlineMode) params.push('-offline');
  if (!discordRichPresence) params.push('+discord_enable 0');
  
  // Hostname/visibility only for dedicated server mode
  if (mode === 'SERVER') {
    if (hostname) params.push(`+hostname "${hostname}"`);
    if (hostdesc) params.push(`+sv_serverbrowserdescription "${hostdesc}"`);
    params.push(`+pylon_host_visibility ${visibility}`);
    if (serverPassword) params.push(`+sv_password "${serverPassword}"`);
    if (hostport && /^\d+$/.test(hostport)) params.push(`+hostport ${hostport}`);
    if (map) params.push(`+map ${map}`);
    if (playlist) params.push(`+launchplaylist ${playlist}`);
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
  
  // Custom command line
  if (customCmd) params.push(customCmd);
  
  return params.join(' ').trim();
}