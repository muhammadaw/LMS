import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const styles = {
  error: 'bg-rose-50/70 border-rose-200 text-rose-900',
  warning: 'bg-amber-50/70 border-amber-200 text-amber-900',
  success: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
  info: 'bg-zinc-50 border-zinc-200 text-zinc-900',
};

const iconStyles = {
  error: 'text-rose-600',
  warning: 'text-amber-600',
  success: 'text-emerald-600',
  info: 'text-zinc-600',
};

export function Alert({
  type = 'info',
  title,
  message,
  onClose,
  className,
}: AlertProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border flex items-start gap-2.5 relative text-xs',
        styles[type],
        className
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', iconStyles[type])} />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="opacity-90">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
