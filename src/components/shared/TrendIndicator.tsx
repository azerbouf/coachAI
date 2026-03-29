import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number; // positive = good, negative = bad
  format?: (v: number) => string;
  positiveIsGood?: boolean; // default true
  showZero?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  format,
  positiveIsGood = true,
  showZero = false,
  className,
}: TrendIndicatorProps) {
  if (!showZero && value === 0) return null;

  const isPositive = value > 0;
  const isNeutral = value === 0;

  const isGood = isNeutral
    ? false
    : positiveIsGood
      ? isPositive
      : !isPositive;

  const color = isNeutral
    ? '#475569'
    : isGood
      ? '#34d399'
      : '#f87171';

  const formatted = format
    ? format(Math.abs(value))
    : `${Math.abs(value).toFixed(1)}%`;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        className
      )}
      style={{ color }}
    >
      <Icon className="w-3 h-3" />
      {formatted}
    </span>
  );
}
