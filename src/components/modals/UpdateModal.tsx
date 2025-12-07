import React, { useState, useEffect } from 'react';

type UpdateModalProps = {
  open: boolean;
  onClose: () => void;
  updateInfo: {
    version: string;
    releaseNotes?: string;
    releaseDate?: string;
  } | null;
  manifest: {
    version: string;
    mandatory_update: boolean;
    release_notes?: string;
    min_version?: string;
    download_url?: string;
  } | null;
  currentVersion: string;
  onDownload: () => void;
  onInstall: () => void;
  downloadProgress?: {
    percent?: number;
    bytesPerSecond?: number;
    transferred?: number;
    total?: number;
  } | null;
  isDownloading: boolean;
  isDownloaded: boolean;
};

const UpdateModal: React.FC<UpdateModalProps> = ({
  open,
  onClose,
  updateInfo,
  manifest,
  currentVersion,
  onDownload,
  onInstall,
  downloadProgress,
  isDownloading,
  isDownloaded,
}) => {
  if (!open || !updateInfo) return null;

  const isMandatory = manifest?.mandatory_update ?? false;
  const newVersion = updateInfo?.version || manifest?.version || 'Unknown';
  const releaseNotes = manifest?.release_notes || updateInfo?.releaseNotes || 'No release notes available.';

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-xl bg-base-100 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
            isMandatory 
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' 
              : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20'
          }`}>
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">
              {isMandatory ? 'Mandatory Update Available' : 'Update Available'}
            </h3>
            <p className="text-sm text-base-content/60">
              Version {newVersion} is now available
            </p>
          </div>
        </div>

        {/* Version Info */}
        <div className="glass rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-base-content/50 mb-1">Current Version</div>
              <div className="text-lg font-semibold">{currentVersion}</div>
            </div>
            <svg className="w-6 h-6 text-base-content/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <div>
              <div className="text-xs text-base-content/50 mb-1">New Version</div>
              <div className="text-lg font-semibold text-emerald-400">{newVersion}</div>
            </div>
          </div>

          {isMandatory && (
            <div className="alert bg-amber-500/10 border-amber-500/20 text-sm">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>This update is required to continue using the launcher</span>
            </div>
          )}
        </div>

        {/* Release Notes */}
        <div className="mb-6">
          <div className="text-sm font-medium text-base-content/70 mb-2">What's New:</div>
          <div className="p-4 rounded-xl bg-base-300/20 border border-white/5 text-sm text-base-content/80 whitespace-pre-wrap">
            {releaseNotes}
          </div>
        </div>

        {/* Download Progress */}
        {isDownloading && downloadProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-base-content/70">Downloading update... (will auto-install when complete)</span>
              <span className="text-base-content/60">
                {downloadProgress.percent ? Math.round(downloadProgress.percent) : 0}%
              </span>
            </div>
            <div className="w-full bg-base-300/30 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full transition-all duration-300"
                style={{ width: `${downloadProgress.percent || 0}%` }}
              />
            </div>
            {downloadProgress.bytesPerSecond && downloadProgress.transferred && downloadProgress.total && (
              <div className="flex items-center justify-between text-xs text-base-content/50 mt-2">
                <span>
                  {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                </span>
                <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isMandatory && !isDownloading && !isDownloaded && (
            <button 
              className="btn btn-ghost flex-1"
              onClick={onClose}
            >
              Remind Me Later
            </button>
          )}
          
          {!isDownloaded && !isDownloading && (
            <button 
              className="btn btn-primary flex-1 gap-2"
              onClick={onDownload}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Update & Restart
            </button>
          )}

          {isDownloaded && (
            <button 
              className="btn btn-success flex-1 gap-2"
              disabled
            >
              <span className="loading loading-spinner loading-sm"></span>
              Installing...
            </button>
          )}
        </div>
      </div>
      {!isMandatory && <div className="modal-backdrop bg-black/60" onClick={onClose} />}
    </div>
  );
};

export default UpdateModal;

