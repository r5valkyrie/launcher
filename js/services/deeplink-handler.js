import { app } from 'electron';

const deeplinkScheme = 'r5v';
const deeplinkQueue = [];

/**
 * Extracts deeplink URLs from command line arguments
 */
export function extractDeeplinks(argv) {
  try {
    return (argv || []).filter((a) => typeof a === 'string' && a.startsWith(`${deeplinkScheme}://`));
  } catch { return []; }
}

/**
 * Handles a deeplink URL
 */
export function handleDeeplink(url, mainWindow) {
  try {
    const u = new URL(url);
    // Example: r5v://mod/install?name=KralCore-KralCore&version=1.8.25
    if (u.hostname === 'mod' && u.pathname === '/install') {
      const name = u.searchParams.get('name') || '';
      const version = u.searchParams.get('version') || '';
      const downloadUrls = u.searchParams.get('downloadUrl')?.split(",") || '';
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
        try { mainWindow.webContents.send('deeplink:mod-install', { url, name, version, downloadUrls }); } catch {}
      } else {
        deeplinkQueue.push(url);
      }
    }
  } catch {}
}

/**
 * Flushes queued deeplinks
 */
export function flushDeeplinks(mainWindow) {
  while (deeplinkQueue.length) {
    const link = deeplinkQueue.shift();
    handleDeeplink(link, mainWindow);
  }
}

/**
 * Sets up deeplink handling for the application
 */
export function setupDeeplinkHandling(mainWindow) {
  // Enforce single instance to route deeplinks to existing window
  const gotInstanceLock = app.requestSingleInstanceLock();
  if (!gotInstanceLock) {
    app.quit();
    return false;
  }

  app.on('second-instance', (_e, argv) => {
    try {
      const links = extractDeeplinks(argv);
      links.forEach((link) => handleDeeplink(link, mainWindow));
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    } catch {}
  });

  // macOS deep link (optional)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeeplink(url, mainWindow);
  });

  return true;
}

/**
 * Registers the app as default protocol client
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
 * Gets the deeplink scheme
 */
export function getDeeplinkScheme() {
  return deeplinkScheme;
}

/**
 * Adds a deeplink to the queue
 */
export function queueDeeplink(url) {
  deeplinkQueue.push(url);
}
