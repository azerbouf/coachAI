import { cn } from '@/lib/utils';

interface MetricBadgeProps {
  value: string | number;
  label?: string;
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function MetricBadge({
  value,
  label,
  color = '#94a3b8',
  size = 'md',
  className,
}: MetricBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}
      style={{
        color,
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
    >
      {value}
      {label && (
        <span style={{ color: `${color}99` }}>{label}</span>
      )}
    </span>
  );
}
