import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Toast, ToastType, ToastOptions } from '../types/ui';
import { setToastHandler } from '../utils/toast';

type ToastContextValue = {
  toasts: Toast[];
  show: (type: ToastType, message: string, options?: ToastOptions) => string;
  hide: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  show: () => '',
  hide: () => {},
  clear: () => {},
});

export const useToast = (): ToastContextValue => {
  return useContext(ToastContext);
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((
    type: ToastType,
    message: string,
    options: ToastOptions = {}
  ): string => {
    const now = Date.now();
    const normalized = message.trim().toLowerCase();
    const duplicateWindowMs = type === "error" ? 1200 : 2200;
    const isDuplicate = toasts.some(
      (t) =>
        t.type === type &&
        t.message.trim().toLowerCase() === normalized &&
        now - t.timestamp < duplicateWindowMs,
    );
    if (isDuplicate) return "";

    const id = crypto.randomUUID();
    const baseDurationByType: Record<ToastType, number> = {
      success: 2600,
      info: 2400,
      warning: 3400,
      error: 4600,
    };
    const duration = options.duration ?? baseDurationByType[type];
    const toast: Toast = {
      id,
      type,
      message,
      duration,
      timestamp: now,
    };
    setToasts(prev => {
      const next = [...prev, toast];
      // Keep stack subtle and short.
      return next.slice(-3);
    });
    if (!options.persist) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, [toasts]);

  useEffect(() => {
    setToastHandler(show);
    return () => setToastHandler(null);
  }, [show]);


  const hide = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextValue = {
    toasts,
    show,
    hide,
    clear,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}