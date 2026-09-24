import type { EventItem } from "@/lib/cms/types";
import { CmsImage } from "@/components/ui/CmsImage";
import { eventDay, eventMonth, eventWhen } from "@/lib/cms/format";
import { cn } from "@/lib/utils";
import { googleCalendarUrl } from "@/lib/calendar";
import { SITE_URL } from "@/lib/site";

const STATUS_LABEL: Record<EventItem["status"], string> = {
  upcoming: "Upcoming",
  ongoing: "Happening now",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** One event as an index row: date block, details, and the way in. */
export function EventRow({
  event,
  headingLevel = "h3",
}: {
  event: EventItem;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const open = event.status === "upcoming" || event.status === "ongoing";

  return (
    <article id={event.slug} className="scroll-mt-28 border-b border-line">
      <div
        className={cn(
          "grid gap-6 py-9 sm:grid-cols-[6rem_1fr] lg:gap-10",
          event.image_url ? "lg:grid-cols-[6rem_1fr_16rem]" : undefined,
        )}
      >
        <div className="flex items-baseline gap-3 sm:block">
          <div className="text-4xl font-semibold leading-none tracking-[-0.04em] tnum">
            {eventDay(event.starts_at)}
          </div>
          <div className="meta sm:mt-2">{eventMonth(event.starts_at)}</div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
              className={cn(
                "font-mono text-micro uppercase",
                event.status === "ongoing"
                  ? "text-acm-bright"
                  : event.status === "cancelled"
                    ? "text-ink-ghost"
                    : "text-ink-faint",
              )}
            >
              {STATUS_LABEL[event.status]}
            </span>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span className="font-mono text-micro uppercase text-ink-faint">
              {eventWhen(event.starts_at, event.ends_at)}
            </span>
          </div>

          <Heading
            className={cn(
              "mt-4 text-2xl font-semibold tracking-[-0.03em] text-balance",
              event.status === "cancelled" &&
                "text-ink-faint line-through decoration-line-strong",
            )}
          >
            {event.title}
          </Heading>

          {event.location ? (
            <p className="mt-2 text-sm text-ink-faint">{event.location}</p>
          ) : null}
          {event.description ? (
            <p className="mt-4 max-w-prose whitespace-pre-line text-[0.975rem] leading-relaxed text-ink-muted text-pretty">
              {event.description}
            </p>
          ) : null}

          {open ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              {event.registration_url ? (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex h-11 items-center gap-3 bg-acm-solid px-6 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-deep"
                >
                  Register
                  <span className="sr-only"> for {event.title}</span>
                  <span
                    aria-hidden
                    className="transition-transform duration-300 ease-out group-hover:translate-x-1"
                  >
                    ↗
                  </span>
                </a>
              ) : null}
              <span className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-micro uppercase">
                <span className="text-ink-faint">Add to calendar:</span>
                <a
                  href={googleCalendarUrl(
                    event,
                    `${SITE_URL}/events#${event.slug}`,
                  )}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Google
                  <span className="sr-only"> Calendar, {event.title}</span>
                </a>
                <a
                  href={`/api/calendar/${event.slug}`}
                  download
                  className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Apple / Outlook (.ics)
                  <span className="sr-only">, {event.title}</span>
                </a>
              </span>
            </div>
          ) : null}

          {event.gallery?.length ? (
            <ul
              className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-4"
              aria-label={`Photos from ${event.title}`}
            >
              {event.gallery.map((url, i) => (
                <li key={url + i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className="relative block aspect-[4/3] overflow-hidden border border-line hover:border-ink-faint"
                  >
                    <CmsImage
                      src={url}
                      alt={`Photo ${i + 1} from ${event.title}`}
                      sizes="(min-width: 640px) 10rem, 33vw"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {event.image_url ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-line sm:col-start-2 lg:col-start-auto">
            <CmsImage
              src={event.image_url}
              alt=""
              sizes="(min-width: 1024px) 16rem, (min-width: 640px) 70vw, 100vw"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
