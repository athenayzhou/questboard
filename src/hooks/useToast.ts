import { useToast } from "../store/ToastProvider";
import type { ToastOptions } from "../types/UI";

export function useToastActions() {
  const { show } = useToast();

  return {
    success: (message: string, options?: ToastOptions) => 
      show('success', message, options),
    
    error: (message: string, options?: ToastOptions) => 
      show('error', message, options),
    
    warning: (message: string, options?: ToastOptions) => 
      show('warning', message, options),
    
    info: (message: string, options?: ToastOptions) => 
      show('info', message, options),
  }
}