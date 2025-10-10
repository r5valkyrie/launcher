import { useEffect } from 'react';
import { useChannel } from '../contexts';

const CONFIG_URL = 'https://blaze.playvalkyrie.org/config.json';

/**
 * Hook to load and manage launcher configuration
 */
export function useLauncherConfig() {
  const {
    config,
    setConfig,
    setSelectedChannel,
    setIsOfflineMode,
    setOfflineCachedAt,
  } = useChannel();

  useEffect(() => {
    (async () => {
      try {
        const json = await (window.electronAPI?.fetchLauncherConfig
          ? window.electronAPI.fetchLauncherConfig(CONFIG_URL)
          : fetch(CONFIG_URL).then((r) => r.json()));

        // Check if running in offline mode
        if (json._offline) {
          setIsOfflineMode(true);
          setOfflineCachedAt(json._cachedAt || null);
          console.log('[Offline Mode] Using cached config from', json._cachedAt ? new Date(json._cachedAt) : 'unknown');
        } else {
          setIsOfflineMode(false);
          setOfflineCachedAt(null);
        }

        setConfig(json);
        const first = json.channels.find((c: any) => c.enabled);
        if (first) setSelectedChannel(first.name);
      } catch (err) {
        console.error('[Config] Failed to load launcher config:', err);
      }
    })();
  }, [setConfig, setSelectedChannel, setIsOfflineMode, setOfflineCachedAt]);

  return { config };
}
