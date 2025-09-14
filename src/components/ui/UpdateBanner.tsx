import React from 'react';

type UpdateBannerProps = {
  updateAvailable: boolean;
  updateDownloaded: boolean;
  updateProgress: number;
  onDownloadUpdate: () => void;
  onRestartToUpdate: () => void;
};

export default function UpdateBanner(props: UpdateBannerProps) {
  const {
    updateAvailable,
    updateDownloaded,
    updateProgress,
    onDownloadUpdate,
    onRestartToUpdate,
  } = props;

  if (updateAvailable && !updateDownloaded) {
    return (
      <div className="glass rounded-xl overflow-hidden xl:col-span-2">
        <div className="flex items-stretch">
          <div className="px-4 py-3 text-sm">Launcher update available</div>
          <div className="ml-auto">
            <button className="btn btn-primary h-full rounded-none" onClick={onDownloadUpdate}>
              {updateProgress > 0 ? `${updateProgress.toFixed(0)}%` : 'Download'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (updateDownloaded) {
    return (
      <div className="glass rounded-xl overflow-hidden xl:col-span-2">
        <div className="flex items-stretch">
          <div className="px-4 py-3 text-sm">Update downloaded</div>
          <div className="ml-auto">
            <button className="btn btn-primary h-full rounded-none" onClick={onRestartToUpdate}>
              Restart to update
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
