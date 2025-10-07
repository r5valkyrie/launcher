import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

type PartInfo = { received: number; total: number };
type FileInfo = {
  status: string;
  received?: number;
  total?: number;
  totalParts?: number;
  parts?: Record<number, PartInfo>;
};

interface DownloadState {
  busy: boolean;
  overall: { index: number; total: number; path: string; completed?: number } | null;
  fileProgress: { path: string; received: number; total: number } | null;
  currentOperation: string;
  progressItems: Record<string, FileInfo>;
  exitingItems: Record<string, boolean>;
  doneCount: number;
  totalCount: number;
  finished: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'warning' | 'info';
  bytesTotal: number;
  bytesReceived: number;
  speedBps: number;
  etaSeconds: number;
  hasStarted: boolean;
  isPaused: boolean;
  receivedAnyBytes: boolean;
}

interface DownloadActions {
  setBusy: (busy: boolean) => void;
  setOverall: (overall: DownloadState['overall']) => void;
  setFileProgress: (progress: DownloadState['fileProgress']) => void;
  setCurrentOperation: (op: string) => void;
  setProgressItems: (items: Record<string, FileInfo>) => void;
  setExitingItems: (items: Record<string, boolean>) => void;
  setDoneCount: (count: number) => void;
  setTotalCount: (count: number) => void;
  setFinished: (finished: boolean) => void;
  setToast: (message: string, type: DownloadState['toastType']) => void;
  setBytesTotal: (bytes: number) => void;
  setBytesReceived: (bytes: number) => void;
  setSpeedBps: (speed: number) => void;
  setEtaSeconds: (eta: number) => void;
  setHasStarted: (started: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setReceivedAnyBytes: (received: boolean) => void;
  resetDownload: () => void;
}

interface DownloadContextType extends DownloadState, DownloadActions {
  // Refs for performance
  bytesTotalRef: React.RefObject<number>;
  bytesReceivedRef: React.RefObject<number>;
  busyRef: React.RefObject<boolean>;
  pausedRef: React.RefObject<boolean>;
  runIdRef: React.RefObject<number>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

const initialState: DownloadState = {
  busy: false,
  overall: null,
  fileProgress: null,
  currentOperation: '',
  progressItems: {},
  exitingItems: {},
  doneCount: 0,
  totalCount: 0,
  finished: false,
  toastMessage: 'Completed',
  toastType: 'success',
  bytesTotal: 0,
  bytesReceived: 0,
  speedBps: 0,
  etaSeconds: 0,
  hasStarted: false,
  isPaused: false,
  receivedAnyBytes: false,
};

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DownloadState>(initialState);

  // Performance refs
  const bytesTotalRef = useRef<number>(0);
  const bytesReceivedRef = useRef<number>(0);
  const busyRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);
  const runIdRef = useRef<number>(0);

  // Sync refs with state
  useEffect(() => { bytesTotalRef.current = state.bytesTotal; }, [state.bytesTotal]);
  useEffect(() => { bytesReceivedRef.current = state.bytesReceived; }, [state.bytesReceived]);
  useEffect(() => { busyRef.current = state.busy; }, [state.busy]);
  useEffect(() => { pausedRef.current = state.isPaused; }, [state.isPaused]);

  // Auto-hide toast
  useEffect(() => {
    if (!state.finished) return;
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, finished: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [state.finished]);

  const actions: DownloadActions = {
    setBusy: (busy) => setState(prev => ({ ...prev, busy })),
    setOverall: (overall) => setState(prev => ({ ...prev, overall })),
    setFileProgress: (fileProgress) => setState(prev => ({ ...prev, fileProgress })),
    setCurrentOperation: (currentOperation) => setState(prev => ({ ...prev, currentOperation })),
    setProgressItems: (progressItems) => setState(prev => ({ ...prev, progressItems })),
    setExitingItems: (exitingItems) => setState(prev => ({ ...prev, exitingItems })),
    setDoneCount: (doneCount) => setState(prev => ({ ...prev, doneCount })),
    setTotalCount: (totalCount) => setState(prev => ({ ...prev, totalCount })),
    setFinished: (finished) => setState(prev => ({ ...prev, finished })),
    setToast: (toastMessage, toastType) => setState(prev => ({ ...prev, toastMessage, toastType })),
    setBytesTotal: (bytesTotal) => setState(prev => ({ ...prev, bytesTotal })),
    setBytesReceived: (bytesReceived) => setState(prev => ({ ...prev, bytesReceived })),
    setSpeedBps: (speedBps) => setState(prev => ({ ...prev, speedBps })),
    setEtaSeconds: (etaSeconds) => setState(prev => ({ ...prev, etaSeconds })),
    setHasStarted: (hasStarted) => setState(prev => ({ ...prev, hasStarted })),
    setIsPaused: (isPaused) => setState(prev => ({ ...prev, isPaused })),
    setReceivedAnyBytes: (receivedAnyBytes) => setState(prev => ({ ...prev, receivedAnyBytes })),
    resetDownload: () => setState(initialState),
  };

  const value: DownloadContextType = {
    ...state,
    ...actions,
    bytesTotalRef,
    bytesReceivedRef,
    busyRef,
    pausedRef,
    runIdRef,
  };

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>;
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within DownloadProvider');
  }
  return context;
}
