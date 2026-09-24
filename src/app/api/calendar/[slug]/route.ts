import { eventIcs } from "@/lib/calendar";
import { getEvents, getSettings } from "@/lib/cms/read";
import { SITE_URL } from "@/lib/site";

/** Download one event as an .ics file (Apple Calendar, Outlook, anything). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response("Not found", { status: 404 });
  const [events, settings] = await Promise.all([getEvents(), getSettings()]);
  const event = events.find((e) => e.slug === slug);
  if (!event) return new Response("Not found", { status: 404 });
  return new Response(eventIcs(event, `${SITE_URL}/events#${slug}`, settings.organization), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
