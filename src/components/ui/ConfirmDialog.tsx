import { createPortal } from "react-dom";
import { cn } from "../../utils/format/cn";

type ConfirmDialogProps = {
  isOpen: boolean;
  options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  options,
  onConfirm,
  onCancel
}: ConfirmDialogProps){
  if(!isOpen) return null;

  const {
    title,
    message,
    confirmText= 'confirm',
    cancelText= 'cancel',
    type= 'warning'
  } = options;

  const typeStyles = {
    danger: "confirm-dialog--danger",
    warning: "confirm-dialog--warning",
    info: "confirm-dialog--info",
  };

  const dialog = (
    <div className="confirm-dialog-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className={cn("confirm-dialog", typeStyles[type])}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="confirm-dialog-title">{title}</h3>
        <p id="confirm-message" className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel} className="confirm-dialog-cancel">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn("confirm-dialog-confirm", `confirm-dialog-confirm--${type}`)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}