import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Toast, ToastType, ToastOptions } from '../types/UI';

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
  const context = useContext(ToastContext);
  return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((
    type: ToastType,
    message: string,
    options: ToastOptions = {}
  ): string => {
    const id = crypto.randomUUID();
    const duration = options.duration ?? 5000;
    const toast: Toast = {
      id,
      type,
      message,
      duration,
      timestamp: Date.now(),
    };
    setToasts(prev => [...prev, toast]);
    if (!options.persist) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

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