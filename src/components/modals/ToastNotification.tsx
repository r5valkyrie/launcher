import React from 'react';

type ToastNotificationProps = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
};

export default function ToastNotification(props: ToastNotificationProps) {
  const { visible, message, type = 'success' } = props;

  if (!visible) return null;

  const alertClass = `alert alert-${type}`;

  return (
    <div className="fixed top-14 right-4 flex flex-col gap-2 items-end pointer-events-none z-50">
      <div className={`${alertClass} toast-slide-in-tr pointer-events-auto shadow-lg`}>
        <span>{message}</span>
      </div>
    </div>
  );
}
