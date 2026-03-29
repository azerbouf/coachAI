import {
  format,
  formatDistanceToNow,
  parseISO,
  isToday,
  isYesterday,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

/**
 * Format a date string for display in activity cards
 */
export function formatActivityDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }

  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo < 7) {
    return format(date, 'EEEE') + ` at ${format(date, 'h:mm a')}`;
  }

  return format(date, 'MMM d, yyyy');
}

/**
 * Format a date for the dashboard header
 */
export function formatDashboardDate(date: Date = new Date()): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Format relative time (e.g. "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  const minutesAgo = differenceInMinutes(new Date(), date);

  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = differenceInHours(new Date(), date);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format sync timestamp
 */
export function formatLastSync(dateString: string | null): string {
  if (!dateString) return 'Never synced';
  return `Last synced ${formatRelativeTime(dateString)}`;
}

/**
 * Get short date for calendar cells
 */
export function formatCalendarDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d');
}

/**
 * Format week range for training plan
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (format(start, 'MMM') === format(end, 'MMM')) {
    return `${format(start, 'MMM d')} – ${format(end, 'd')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

/**
 * Format ISO date string to display date
 */
export function formatDate(dateString: string, formatStr = 'MMM d, yyyy'): string {
  return format(parseISO(dateString), formatStr);
}

/**
 * Get day of week abbreviation
 */
export function getDayAbbrev(dayOfWeek: number): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dayOfWeek] ?? '';
}
