import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../utils/cn';

type LoadingButtonProps = {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function LoadingButton({ 
  loading = false, 
  children, 
  className, 
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <button 
      className={cn("relative", className)} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        />
      )}
      <span className={cn(loading && "invisible")}>
        {children}
      </span>
    </button>
  );
}