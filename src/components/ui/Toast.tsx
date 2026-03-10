import { useEffect } from "react";
import type { Toast } from "../../types/UI";
import { cn } from "../../utils/cn";
import { useToast } from "../../store/ToastProvider";

type ToastItemProps = {
  toast: Toast;
  onHide: (id: string) => void;
};

function ToastItem({ toast, onHide }: ToastItemProps) {
  const { id, type, message } = toast;

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onHide(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, onHide, toast.duration]);

  return (
    <div className={cn('toast-item', type)}>
      <div className="toast-item-content">
        <span>{message}</span>
        <button type="button" onClick={() => onHide(id)} className="toast-item-close">
          ×
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, hide } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onHide={hide}
        />
      ))}
    </div>
  )
}