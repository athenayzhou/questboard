import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type PromptDialogProps = {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  multiline?: boolean;
  maxLength?: number;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function PromptDialog({
  isOpen,
  title,
  message,
  placeholder,
  initialValue = "",
  multiline = false,
  maxLength,
  confirmText = "confirm",
  cancelText = "cancel",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValue(initialValue);
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const body = (
    <div className="prompt-dialog-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        aria-describedby={message ? "prompt-message" : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="prompt-title" className="prompt-dialog-title">{title}</h3>
        {message ? <p id="prompt-message" className="prompt-dialog-message">{message}</p> : null}
        {multiline ? (
          <textarea
            ref={(el) => {
              inputRef.current = el;
            }}
            className="prompt-dialog-input prompt-dialog-input--textarea"
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <input
            ref={(el) => {
              inputRef.current = el;
            }}
            className="prompt-dialog-input"
            type="text"
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm(value);
              if (e.key === "Escape") onCancel();
            }}
          />
        )}
        <div className="prompt-dialog-actions">
          <button type="button" className="prompt-dialog-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className="prompt-dialog-confirm"
            onClick={() => onConfirm(value)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}

