import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Lines } from "@/components/ui/Lines";
import { EventRow } from "@/components/events/EventRow";
import type { EventItem, Section } from "@/lib/cms/types";

/** The next few events. The homepage omits this section when none are coming up. */
export function EventsSection({ section, index, events }: { section: Section; index: string; events: EventItem[] }) {
  return (
    <section className="shell py-section" aria-labelledby="events">
      <SectionHeading
        index={index}
        eyebrow={section.eyebrow}
        title={
          <span id="events">
            <Lines text={section.title} />
          </span>
        }
        lede={section.body || undefined}
        align="wide"
        action={
          section.primary_label && section.primary_href ? (
            <ArrowLink href={section.primary_href}>{section.primary_label}</ArrowLink>
          ) : undefined
        }
      />
      <div className="mt-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
