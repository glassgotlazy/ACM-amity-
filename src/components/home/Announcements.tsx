import Link from "next/link";
import type { Announcement, Section } from "@/lib/cms/types";
import { noticeDate } from "@/lib/cms/format";

/** A slim notice strip under the hero. Omitted entirely when nothing is published. */
export function Announcements({ section, items }: { section: Section; items: Announcement[] }) {
  return (
    <section aria-label={section.eyebrow || "Announcements"} className="border-b border-line bg-surface">
      <ul className="shell divide-y divide-line">
        {items.map((item) => {
          const external = item.link_url ? /^(https?:|mailto:|tel:)/i.test(item.link_url) : false;
          return (
            <li key={item.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="flex shrink-0 items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-acm" aria-hidden />
                <span className="meta-accent">{section.eyebrow || "Notice"}</span>
                <span className="label-sm text-ink-ghost">{noticeDate(item.date)}</span>
              </span>
              <p className="flex-1 text-[0.9375rem] leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">{item.title}</span>
                {item.body ? <span> — {item.body}</span> : null}
              </p>
              {item.link_url ? (
                external ? (
                  <a
                    href={item.link_url}
                    target={item.link_url.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer noopener"
                    className="shrink-0 label text-acm-bright transition-colors hover:text-ink"
                  >
                    Details ↗<span className="sr-only">: {item.title}</span>
                  </a>
                ) : (
                  <Link
                    href={item.link_url}
                    className="shrink-0 label text-acm-bright transition-colors hover:text-ink"
                  >
                    Details<span className="sr-only">: {item.title}</span>
                  </Link>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
