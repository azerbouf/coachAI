/**
 * Convert meters per second to seconds per kilometer
 */
export function mpsToSecondsPerKm(mps: number): number {
  if (!mps || mps <= 0) return 0;
  return 1000 / mps;
}

/**
 * Convert seconds per km to min:sec string
 */
export function secondsPerKmToString(secondsPerKm: number): string {
  if (!secondsPerKm || secondsPerKm <= 0) return '--:--';
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert seconds per km to min:sec/km string with unit
 */
export function formatPace(secondsPerKm: number): string {
  return `${secondsPerKmToString(secondsPerKm)}/km`;
}

/**
 * Convert total seconds to h:mm:ss or m:ss format
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format duration as "Xh Ym" or "Ym Zs"
 */
export function formatDurationLong(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m} min`;
}

/**
 * Convert meters to km string
 */
export function formatDistance(meters: number, decimals = 2): string {
  const km = meters / 1000;
  return km.toFixed(decimals);
}

/**
 * Format distance with unit
 */
export function formatDistanceWithUnit(meters: number): string {
  const km = meters / 1000;
  if (km >= 1) {
    return `${km.toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Get pace comparison to average
 * Returns: positive = faster than avg, negative = slower
 */
export function paceDeviation(
  paceSecondsPerKm: number,
  avgPaceSecondsPerKm: number
): number {
  return avgPaceSecondsPerKm - paceSecondsPerKm;
}

/**
 * Get color class for pace based on deviation from average
 */
export function getPaceColor(
  paceSecondsPerKm: number,
  avgPaceSecondsPerKm: number
): string {
  const deviation = paceDeviation(paceSecondsPerKm, avgPaceSecondsPerKm);
  if (deviation > 15) return '#34d399'; // green - significantly faster
  if (deviation > 5) return '#86efac'; // light green - slightly faster
  if (deviation < -15) return '#f87171'; // red - significantly slower
  if (deviation < -5) return '#fca5a5'; // light red - slightly slower
  return '#60a5fa'; // blue - on pace
}

/**
 * Convert min/km string like "4:30" to seconds per km
 */
export function paceStringToSeconds(paceStr: string): number {
  const parts = paceStr.split(':');
  if (parts.length !== 2) return 0;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  return mins * 60 + secs;
}
