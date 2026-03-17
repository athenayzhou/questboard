import { cn } from '../../utils/format/cn';

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
    danger: 'border-red-500 bg-red-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className="confirm-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className={cn(
        "confirm-dialog bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border-2",
        typeStyles[type]
      )}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 text-white rounded transition-colors",
              type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
              type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}