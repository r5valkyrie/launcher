import React from 'react';

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  busy?: boolean;
};

export default function ConfirmModal(props: ConfirmModalProps) {
  const {
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    busy = false,
  } = props;

  if (!open) return null;

  const variantStyles = {
    danger: {
      gradient: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/30',
      buttonClass: 'btn-error',
      iconBg: 'from-red-500/20 to-rose-500/10',
      iconColor: 'text-red-400',
    },
    warning: {
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/30',
      buttonClass: 'btn-warning',
      iconBg: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
    },
    info: {
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/30',
      buttonClass: 'btn-primary',
      iconBg: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass rounded-2xl w-[480px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className={`bg-gradient-to-r ${styles.iconBg} to-transparent px-6 py-5 flex items-center gap-4 border-b border-white/5`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.gradient} grid place-items-center shadow-lg ${styles.shadow}`}>
              {variant === 'danger' ? (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              ) : variant === 'warning' ? (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <div>
              <div className="text-lg font-semibold">{title}</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-base-content/70 whitespace-pre-line">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
            <button 
              className="btn btn-ghost border border-white/10 hover:border-white/20 gap-2"
              onClick={onClose}
              disabled={busy}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              {cancelText}
            </button>
            <button 
              className={`btn ${styles.buttonClass} gap-2`}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : variant === 'danger' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

