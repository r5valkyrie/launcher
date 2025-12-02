import React, { useEffect, useState } from 'react';

type ToastNotificationProps = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
};

export default function ToastNotification(props: ToastNotificationProps) {
  const { visible, message, type = 'success' } = props;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsExiting(false);
    }
  }, [visible]);

  const handleAnimationEnd = () => {
    if (isExiting) {
      setIsExiting(false);
    }
  };

  if (!visible && !isExiting) return null;

  // Get icon and colors based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ),
          bgColor: 'bg-gradient-to-r from-green-500/90 to-emerald-500/90',
          borderColor: 'border-green-400/50',
          glowColor: 'shadow-green-500/25',
          iconBg: 'bg-white/20'
        };
      case 'error':
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ),
          bgColor: 'bg-gradient-to-r from-red-500/90 to-rose-500/90',
          borderColor: 'border-red-400/50',
          glowColor: 'shadow-red-500/25',
          iconBg: 'bg-white/20'
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ),
          bgColor: 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90',
          borderColor: 'border-yellow-400/50',
          glowColor: 'shadow-yellow-500/25',
          iconBg: 'bg-white/20'
        };
      case 'info':
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          ),
          bgColor: 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90',
          borderColor: 'border-blue-400/50',
          glowColor: 'shadow-blue-500/25',
          iconBg: 'bg-white/20'
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ),
          bgColor: 'bg-gradient-to-r from-green-500/90 to-emerald-500/90',
          borderColor: 'border-green-400/50',
          glowColor: 'shadow-green-500/25',
          iconBg: 'bg-white/20'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed top-14 right-4 flex flex-col gap-2 items-end pointer-events-none z-50">
      <div 
        className={`
          modern-toast-enter
          pointer-events-auto 
          ${config.bgColor} 
          ${config.borderColor} 
          ${config.glowColor}
          backdrop-blur-md
          border
          rounded-2xl
          shadow-2xl
          px-5 py-4
          min-w-[280px] max-w-[600px]
          flex items-center gap-4
          text-white font-medium
          transition-all duration-300
          hover:scale-[1.02] hover:shadow-3xl
        `}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
          {config.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-3 right-3 h-1 bg-white/20 overflow-hidden rounded-full">
          <div className="h-full bg-white/50 modern-toast-progress-bar rounded-full"></div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-sm -z-10"></div>
      </div>
    </div>
  );
}
