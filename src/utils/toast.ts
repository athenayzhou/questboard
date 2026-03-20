import type { ToastType, ToastOptions } from "../types/ui";

type ToastShow = (type: ToastType, message: string, options?: ToastOptions) => string;

let toastHandler: ToastShow | null = null;

export function setToastHandler(handler: ToastShow | null): void {
  toastHandler = handler;
}

export function showToast(type: ToastType, message: string, options?: ToastOptions): string {
  if (toastHandler) {
    return toastHandler(type, message, options);
  }
  if (process.env.NODE_ENV === "development") {
    console.warn("[toastAPI] no toast handler registered; toast not shown:", type, message);
  }
  return "";
}