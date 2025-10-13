// ============================================
// TIME UTILITIES
// Functions for formatting and handling time-related operations
// ============================================

/**
 * Formats a timestamp into a human-readable relative time string
 * @param timestamp - The timestamp string to format (ISO format or null)
 * @returns A formatted time string like "5min 30sec ago" or "Nie" if null
 */
export const formatTime = (timestamp: string | null): string => {
  if (!timestamp) return 'Nie';

  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d`;
  } else if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    const remainingSeconds = diffSeconds % 60;
    if (remainingMinutes > 0) {
      return `${diffHours}h ${remainingMinutes}min`;
    } else {
      return `${diffHours}h ${remainingSeconds}sec`;
    }
  } else if (diffMinutes > 0) {
    const remainingSeconds = diffSeconds % 60;
    return `${diffMinutes}min ${remainingSeconds}sec`;
  } else {
    return `${diffSeconds}sec`;
  }
};