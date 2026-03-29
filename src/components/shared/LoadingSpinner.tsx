import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  color = '#a78bfa',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: `${color}30`,
        borderTopColor: color,
      }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card', className)}>
      <div className="space-y-3">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-8 w-1/2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded', className)} />;
}
