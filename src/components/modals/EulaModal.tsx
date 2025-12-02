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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[900px] max-w-[95vw] max-h-[85vh] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-lg shadow-primary/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">End User License Agreement</div>
              <div className="text-sm text-base-content/60">Please read carefully before continuing</div>
            </div>
            {loading && (
              <div className="flex items-center gap-2 bg-base-300/20 px-3 py-1.5 rounded-lg border border-white/5">
                <svg className="w-4 h-4 text-primary animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span className="text-sm text-base-content/60">Loading...</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-base-300/20 border border-white/5 rounded-xl p-5 max-h-[55vh] overflow-y-auto">
              {content ? (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-base-content/60">Failed to load EULA.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-base-content/50">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>By clicking "I Agree", you accept the terms above</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  className="btn btn-ghost gap-2 border border-white/10 hover:border-white/20" 
                  onClick={onDecline}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Decline
                </button>
                <button 
                  className="btn btn-primary gap-2 px-6" 
                  onClick={onAccept}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
