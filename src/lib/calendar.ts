import type { EventItem, SiteSettings } from "@/lib/cms/types";

/**
 * Calendar exports for events: a Google Calendar link, an .ics file for
 * everything else (Apple, Outlook), and schema.org data so search engines
 * can list the event.
 */

/** Events with no end time are treated as two hours long. */
const endOf = (e: Pick<EventItem, "starts_at" | "ends_at">) => e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 2 * 3600_000).toISOString();

/** 2026-03-05T10:30:00.000Z → 20260305T103000Z */
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const isOnline = (location: string) => /\b(online|zoom|meet|teams|virtual|discord)\b/i.test(location);

export function googleCalendarUrl(e: EventItem, pageUrl: string) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.starts_at)}/${stamp(endOf(e))}`,
    details: [e.description.slice(0, 1200), pageUrl].filter(Boolean).join("\n\n"),
    location: e.location,
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 lines are folded at 75 octets; continuation lines start with a space. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function eventIcs(e: EventItem, pageUrl: string, organiser: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escapeText(organiser)}//Events//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@acm-buildhub`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.starts_at)}`,
    `DTEND:${stamp(endOf(e))}`,
    `SUMMARY:${escapeText(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${escapeText(`${e.description}\n\n${pageUrl}`)}`] : [`DESCRIPTION:${escapeText(pageUrl)}`]),
    ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
    `URL:${pageUrl}`,
    `STATUS:${e.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** schema.org Event entries for the events page. */
export function eventsJsonLd(events: EventItem[], siteUrl: string, settings: Pick<SiteSettings, "organization" | "site_name">) {
  return events.map((e) => {
    const online = isOnline(e.location);
    const url = `${siteUrl}/events#${e.slug}`;
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: e.title,
      ...(e.description ? { description: e.description.slice(0, 500) } : {}),
      startDate: e.starts_at,
      endDate: endOf(e),
      eventStatus: e.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      eventAttendanceMode: online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
      location: online
        ? { "@type": "VirtualLocation", url: e.registration_url ?? url }
        : { "@type": "Place", name: e.location || settings.organization, address: e.location || settings.organization },
      ...(e.image_url || e.gallery?.length ? { image: [e.image_url, ...(e.gallery ?? [])].filter(Boolean).slice(0, 5) } : {}),
      organizer: { "@type": "Organization", name: settings.organization, url: siteUrl },
      url,
      ...(e.registration_url ? { offers: { "@type": "Offer", url: e.registration_url, price: 0, priceCurrency: "INR", availability: "https://schema.org/InStock" } } : {}),
    };
  });
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
