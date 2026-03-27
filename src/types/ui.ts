/* VALUDATION RESULT */

export type ValidationResult = {
  isValid: boolean;
  error?: string;
}

export type ValidationErrors = Record<string, string>;


/* TOAST NOTIFICATION */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  timestamp: number;
}

export type ToastOptions={
  duration?: number;
  persist?: boolean;
}


/* CONFIRMATION DIALOGUE */

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
};

export type ConfirmResult = boolean;