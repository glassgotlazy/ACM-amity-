import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { Reveal } from "@/components/ui/Reveal";
import { EventRow } from "@/components/events/EventRow";
import { getEvents, getPage, getSettings, upcoming } from "@/lib/cms/read";
import { eventsJsonLd, jsonLd } from "@/lib/calendar";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Sessions, workshops and build nights run by ACM @ Amity — what is coming up and what already happened.",
};

/** Rebuilt at least hourly so an event slides from "upcoming" to "past" on its own. */
export const revalidate = 3600;

export default async function EventsPage() {
  const [events, settings, page] = await Promise.all([
    getEvents(),
    getSettings(),
    getPage("page_events"),
  ]);
  const next = upcoming(events);
  const nextIds = new Set(next.map((e) => e.id));
  const past = events.filter((e) => !nextIds.has(e.id)).reverse();

  // Listed for search engines: what is coming up, plus the most recent past events.
  const listed = [...next, ...past.slice(0, 10)].filter(
    (e) => e.status !== "cancelled" || nextIds.has(e.id),
  );

  return (
    <>
      {listed.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(eventsJsonLd(listed, SITE_URL, settings)),
          }}
        />
      ) : null}
      <PageHeader
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
        meta={[
          { label: "Coming up", value: String(next.length) },
          { label: "Past events", value: String(past.length) },
        ]}
      />

      <section className="shell py-section" aria-labelledby="upcoming">
        <Reveal className="flex items-baseline gap-4 border-b border-line pb-4">
          <h2 id="upcoming" className="meta">
            Coming up
          </h2>
        </Reveal>
        {next.length ? (
          next.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <div className="border-b border-line py-14">
            <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">
              Nothing is scheduled right now. New events are announced here
              first
              {settings.registration_url
                ? " — register with the chapter to hear about them"
                : ""}
              .
            </p>
            <Link
              href="/join"
              className="mt-6 inline-flex label text-acm-bright transition-colors hover:text-ink"
            >
              Join ACM
            </Link>
          </div>
        )}
      </section>

      {past.length ? (
        <section
          className="border-t border-line bg-surface/25"
          aria-labelledby="past"
        >
          <div className="shell py-section">
            <Reveal className="flex items-baseline gap-4 border-b border-line pb-4">
              <h2 id="past" className="meta">
                Past events
              </h2>
            </Reveal>
            {past.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
