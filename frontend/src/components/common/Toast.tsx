import { useContext, useState, useEffect } from 'react';
import { ToastContext, useToastState, type Toast } from '../../hooks/useToast';

/* ── Provider: mounts once in App.tsx ── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const state = useToastState();
  return (
    <ToastContext.Provider value={state}>
      {children}
    </ToastContext.Provider>
  );
}

/* ── Individual toast item ── */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const borderColor =
    toast.type === 'success' ? 'border-green-500' :
    toast.type === 'error'   ? 'border-uia-red' :
                               'border-uia-blue';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'pointer-events-auto flex items-start gap-3',
        'bg-white shadow-xl border border-gray-100 border-l-4 rounded-r-lg',
        'px-4 py-3 min-w-[240px] max-w-[340px]',
        'transition-all duration-200',
        borderColor,
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
      ].join(' ')}
    >
      <p className="flex-1 text-sm font-display text-gray-800 leading-snug">{toast.message}</p>
      <button
        onClick={handleClose}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors leading-none text-base mt-0.5"
      >
        ×
      </button>
    </div>
  );
}

/* ── Container: render once inside ToastProvider ── */
export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, removeToast } = ctx;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
