import { app } from 'electron';

const deeplinkScheme = 'r5v';
const deeplinkQueue = [];

/**
 * Extracts deeplink URLs from command line arguments
 */
export function extractDeeplinks(argv) {
  try {
    return (argv || []).filter((a) => typeof a === 'string' && a.startsWith(`${deeplinkScheme}://`));
  } catch { 
    return []; 
  }
}

/**
 * Handles a deeplink URL by parsing and routing it
 */
export function handleDeeplink(url, getMainWindow) {
  try {
    const u = new URL(url);
    // Example: r5v://mod/install?name=KralCore-KralCore&version=1.8.25
    if (u.hostname === 'mod' && u.pathname === '/install') {
      const name = u.searchParams.get('name') || '';
      const version = u.searchParams.get('version') || '';
      const downloadUrls = u.searchParams.get('downloadUrl')?.split(",") || '';
      
      const mainWindow = getMainWindow();
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
        try { 
          mainWindow.webContents.send('deeplink:mod-install', { url, name, version, downloadUrls }); 
        } catch {}
      } else {
        deeplinkQueue.push(url);
      }
    }
  } catch {}
}

/**
 * Flushes queued deeplinks when renderer is ready
 */
export function flushDeeplinks(getMainWindow) {
  while (deeplinkQueue.length) {
    const link = deeplinkQueue.shift();
    handleDeeplink(link, getMainWindow);
  }
}

/**
 * Sets up deeplink handling for the application
 */
export function setupDeeplinkHandling(getMainWindow) {
  // Enforce single instance to route deeplinks to existing window
  const gotInstanceLock = app.requestSingleInstanceLock();
  
  if (!gotInstanceLock) {
    app.quit();
    return false;
  }

  app.on('second-instance', (_e, argv) => {
    try {
      const links = extractDeeplinks(argv);
      links.forEach((link) => handleDeeplink(link, getMainWindow));
      const mainWindow = getMainWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    } catch {}
  });

  // macOS deep link (optional)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeeplink(url, getMainWindow);
  });

  return true;
}

/**
 * Registers the custom protocol scheme with the OS
 */
export function registerProtocolClient() {
  try {
    if (process.defaultApp && process.platform === 'win32') {
      app.setAsDefaultProtocolClient(deeplinkScheme, process.execPath, [process.argv[1]]);
    } else {
      app.setAsDefaultProtocolClient(deeplinkScheme);
    }
  } catch {}
}

/**
 * Queues deeplinks from process arguments
 */
export function queueInitialDeeplinks() {
  try {
    extractDeeplinks(process.argv).forEach((link) => deeplinkQueue.push(link));
  } catch {}
}

export { deeplinkScheme };
