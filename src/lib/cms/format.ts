/**
 * Event times are shown in India Standard Time for every visitor — the events
 * happen on campus, so the campus clock is the one that matters.
 */
const TZ = "Asia/Kolkata";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts });

export const eventDay = (iso: string) => fmt({ day: "2-digit" }).format(new Date(iso));
export const eventMonth = (iso: string) => fmt({ month: "short" }).format(new Date(iso)).toUpperCase();
export const eventDate = (iso: string) =>
  fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
export const eventTime = (iso: string) => fmt({ hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).toUpperCase();

export function eventWhen(starts: string, ends: string | null) {
  const sameDay = ends && eventDate(starts) === eventDate(ends);
  if (!ends) return `${eventDate(starts)} · ${eventTime(starts)}`;
  return sameDay
    ? `${eventDate(starts)} · ${eventTime(starts)} – ${eventTime(ends)}`
    : `${eventDate(starts)} – ${eventDate(ends)}`;
}

export const noticeDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
