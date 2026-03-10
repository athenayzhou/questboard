import type { ConfirmOptions } from "../../types/UI";

type ConfirmDialogProps = {
  isOpen: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const {
    title = "Confirm",
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
  } = options;

  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel} className="confirm-dialog-cancel">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="confirm-dialog-confirm">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
