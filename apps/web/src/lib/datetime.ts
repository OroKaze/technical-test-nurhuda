export const BUSINESS_TIMEZONE = 'Asia/Jakarta';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: BUSINESS_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function formatDateJakarta(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return String(input);
  return dateFormatter.format(date);
}

export function formatTimeJakarta(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return String(input);
  return timeFormatter.format(date);
}

export function formatDateTimeJakarta(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return String(input);
  return dateTimeFormatter.format(date);
}

export interface FormattedAttendanceDateTime {
  date: string;
  time: string;
}

/**
 * Parses attendance date & time in Jakarta timezone into separate date (YYYY-MM-DD) and time (HH:mm).
 * Returns null if the input is null or undefined.
 */
export function parseAttendanceDateTimeJakarta(
  input: string | Date | null | undefined,
  fallbackDate?: string,
): FormattedAttendanceDateTime | null {
  if (!input) return null;
  const date = typeof input === 'string' ? new Date(input) : input;
  if (!isNaN(date.getTime())) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const year = parts.find((p) => p.type === 'year')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';

    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}`,
    };
  }

  if (typeof input === 'string' && fallbackDate) {
    return {
      date: fallbackDate,
      time: input.slice(0, 5),
    };
  }

  return null;
}

/**
 * Formats attendance date & time in Jakarta timezone to "YYYY-MM-DD HH:mm" without seconds.
 * Returns null if the input is null or undefined.
 */
export function formatAttendanceDateTimeJakarta(
  input: string | Date | null | undefined,
  fallbackDate?: string,
): string | null {
  const parsed = parseAttendanceDateTimeJakarta(input, fallbackDate);
  if (!parsed) return null;
  return `${parsed.date} ${parsed.time}`;
}

export function getTodayJakarta(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function getFirstDayOfCurrentMonthJakarta(): string {
  const today = getTodayJakarta();
  return `${today.slice(0, 7)}-01`;
}
