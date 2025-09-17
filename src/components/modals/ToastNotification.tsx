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
          icon: '✅',
          bgColor: 'bg-gradient-to-r from-green-500/90 to-emerald-500/90',
          borderColor: 'border-green-400/50',
          glowColor: 'shadow-green-500/25'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-gradient-to-r from-red-500/90 to-rose-500/90',
          borderColor: 'border-red-400/50',
          glowColor: 'shadow-red-500/25'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90',
          borderColor: 'border-yellow-400/50',
          glowColor: 'shadow-yellow-500/25'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90',
          borderColor: 'border-blue-400/50',
          glowColor: 'shadow-blue-500/25'
        };
      default:
        return {
          icon: '✅',
          bgColor: 'bg-gradient-to-r from-green-500/90 to-emerald-500/90',
          borderColor: 'border-green-400/50',
          glowColor: 'shadow-green-500/25'
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
          border-2
          rounded-2xl
          shadow-2xl
          px-6 py-4
          min-w-[280px] max-w-[600px]
          flex items-center gap-3
          text-white font-medium
          transition-all duration-300
          hover:scale-105 hover:shadow-3xl
        `}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Icon */}
        <div className="text-2xl flex-shrink-0 animate-bounce">
          {config.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-2 right-2 h-1 bg-white/20 overflow-hidden" style={{ borderRadius: '1rem 1rem 1rem 1rem', margin: '0 2px 2px 2px' }}>
          <div className="h-full bg-white/40 modern-toast-progress-bar" style={{ borderRadius: '0 0 1rem 1rem' }}></div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-sm -z-10"></div>
      </div>
    </div>
  );
}
