import { useEffect } from 'react';
import { useDownload } from '../contexts';

/**
 * Hook to manage download progress IPC listeners
 */
export function useDownloadProgress() {
  const {
    setBytesTotal,
    setBytesReceived,
    setSpeedBps,
    setEtaSeconds,
    setProgressItems,
    setCurrentOperation,
    setOverall,
    setFileProgress,
    setDoneCount,
    setFinished,
    setToast,
    setHasStarted,
    setReceivedAnyBytes,
    setIsPaused,
    bytesTotalRef,
    bytesReceivedRef,
    runIdRef,
    pausedRef,
  } = useDownload();

  useEffect(() => {
    if (!window.electronAPI) return;

    // Register progress listeners
    const handleProgress = (channel: string, handler: (payload: any) => void) => {
      window.electronAPI!.onProgress(channel, handler);
    };

    // Progress bytes total
    handleProgress('progress:bytes:total', (p: any) => {
      setBytesTotal(Number(p?.totalBytes || 0));
    });

    // Progress bytes delta
    handleProgress('progress:bytes', (p: any) => {
      const delta = Number(p?.delta || 0);
      if (delta !== 0) {
        setBytesReceived(prev => prev + delta);
        setReceivedAnyBytes(true);
      }
    });

    // Speed and ETA calculation
    const speedInterval = setInterval(() => {
      const currentRunId = runIdRef.current;
      const localBytesTotal = bytesTotalRef.current;
      const localBytesReceived = bytesReceivedRef.current;
      const paused = pausedRef.current;

      if (paused || localBytesTotal === 0 || localBytesReceived === 0) {
        setSpeedBps(0);
        setEtaSeconds(0);
        return;
      }

      // Calculate speed (simplified - in real implementation track over time window)
      // This is a placeholder - actual implementation should track bytes over time
      const remaining = localBytesTotal - localBytesReceived;
      if (remaining <= 0) {
        setSpeedBps(0);
        setEtaSeconds(0);
      }
    }, 1000);

    // Progress start
    handleProgress('progress:start', (p: any) => {
      setHasStarted(true);
      setCurrentOperation('Downloading');
      setOverall({ index: p.index, total: p.total, path: p.path, completed: p.completed });
    });

    // Progress done
    handleProgress('progress:done', (p: any) => {
      setDoneCount(p.completed || 0);
    });

    // Progress complete
    handleProgress('progress:complete', () => {
      setFinished(true);
      setToast('Download completed successfully', 'success');
      setCurrentOperation('');
    });

    // Progress error
    handleProgress('progress:error', (p: any) => {
      setToast(p.message || 'Download error', 'error');
    });

    // Progress cancelled
    handleProgress('progress:cancelled', () => {
      setToast('Download cancelled', 'warning');
      setCurrentOperation('');
    });

    // Progress paused
    handleProgress('progress:paused', () => {
      setIsPaused(true);
      setCurrentOperation('Paused');
    });

    // Progress resumed
    handleProgress('progress:resumed', () => {
      setIsPaused(false);
      setCurrentOperation('Downloading');
    });

    return () => {
      clearInterval(speedInterval);
    };
  }, [
    setBytesTotal,
    setBytesReceived,
    setSpeedBps,
    setEtaSeconds,
    setProgressItems,
    setCurrentOperation,
    setOverall,
    setFileProgress,
    setDoneCount,
    setFinished,
    setToast,
    setHasStarted,
    setReceivedAnyBytes,
    setIsPaused,
    bytesTotalRef,
    bytesReceivedRef,
    runIdRef,
    pausedRef,
  ]);
}
