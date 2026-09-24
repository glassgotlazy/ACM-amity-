import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { EventRow } from "@/components/events/EventRow";
import { getEvents, getSettings, upcoming } from "@/lib/cms/read";

export const metadata: Metadata = {
  title: "Events",
  description: "Sessions, workshops and build nights run by ACM @ Amity — what is coming up and what already happened.",
};

/** Rebuilt at least hourly so an event slides from "upcoming" to "past" on its own. */
export const revalidate = 3600;

export default async function EventsPage() {
  const [events, settings] = await Promise.all([getEvents(), getSettings()]);
  const next = upcoming(events);
  const nextIds = new Set(next.map((e) => e.id));
  const past = events.filter((e) => !nextIds.has(e.id)).reverse();

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title={
          <>
            WHERE THE CHAPTER
            <br />
            MEETS IN PERSON.
          </>
        }
        lede="Sessions, workshops and build nights. Open to every member — and most of them to anyone curious enough to turn up."
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
              Nothing is scheduled right now. New events are announced here first
              {settings.registration_url ? " — register with the chapter to hear about them" : ""}.
            </p>
            <Link
              href="/join"
              className="mt-6 inline-flex font-mono text-label uppercase text-acm-bright transition-colors hover:text-ink"
            >
              Join ACM →
            </Link>
          </div>
        )}
      </section>

      {past.length ? (
        <section className="border-t border-line bg-surface/25" aria-labelledby="past">
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
