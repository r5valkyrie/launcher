import React from 'react';

type EulaModalProps = {
  open: boolean;
  loading: boolean;
  content: string;
  onDecline: () => void;
  onAccept: () => void;
};

export default function EulaModal({ open, loading, content, onDecline, onAccept }: EulaModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-xl w-[900px] max-w-[95vw] max-h-[85vh] overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
            <div className="text-base font-semibold">End User License Agreement</div>
            <div className="ml-auto text-xs opacity-70">{loading ? 'Loading…' : ''}</div>
          </div>
          <div className="p-4">
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[55vh] pr-2">
              {content || 'Failed to load EULA.'}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn btn-ghost" onClick={onDecline}>Decline</button>
              <button className="btn btn-primary" onClick={onAccept}>I Agree</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


