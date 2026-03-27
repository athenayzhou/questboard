import type { Toast } from "../../types/ui";
import { cn } from "../../utils/format/cn";
import { useToast } from "../../store/toast";

type ToastItemProps = {
  toast: Toast;
  onHide: (id: string) => void;
};

function ToastItem({ toast, onHide }: ToastItemProps) {
  const { id, type, message } = toast;
  const iconByType: Record<Toast["type"], string> = {
    success: "✨",
    info: "💬",
    warning: "⚠️",
    error: "🌧️",
  };

  return (
    <div className={cn('toast-item', type)}>
      <div className="toast-item-content">
        <span className="toast-item-message">
          <span className="toast-item-icon" aria-hidden>
            {iconByType[type]}
          </span>
          <span>{message}</span>
        </span>
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