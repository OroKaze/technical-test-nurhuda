/**
 * Derives the business date (YYYY-MM-DD) in Asia/Jakarta from an exact instant.
 * Never depends on the host machine's local timezone.
 */
export function toBusinessDate(instant: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(instant);
}

/**
 * Returns the first day of the current business month in Asia/Jakarta (YYYY-MM-DD).
 */
export function firstDayOfBusinessMonth(instant: Date): string {
  const today = toBusinessDate(instant);
  return `${today.slice(0, 7)}-01`;
}
