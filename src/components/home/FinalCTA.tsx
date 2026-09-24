import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { lines, type Section } from "@/lib/cms/types";
import { displayCase } from "@/lib/display-case";

export function FinalCTA({ section, pillars }: { section: Section; pillars: string[] }) {
  return (
    <section className="relative overflow-hidden border-t border-line bg-surface/40" aria-labelledby="final">
      <div className="shell relative py-section">
        <MaskedHeadline
          id="final"
          as="h2"
          className="text-display-lg"
          // Two statements: the one to stop saying (quiet), the one to say instead.
          lines={lines(displayCase(section.title)).map((text) => ({ text, className: "text-ink-faint" }))}
        />

        {section.subtitle ? (
          <MaskedHeadline
            as="h3"
            className="mt-8 text-display-lg"
            delay={0.12}
            lines={lines(displayCase(section.subtitle))}
          />
        ) : null}

        <div className="mt-14 flex flex-wrap items-center gap-2 border-t border-line pt-8">
          {pillars.map((word) => (
            <span key={word} className="rounded-full bg-surface-high/70 px-3 py-1 text-sm text-ink-muted">
              {displayCase(word)}
            </span>
          ))}
        </div>

        {section.body ? (
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{section.body}</p>
        ) : null}
      </div>
    </section>
  );
}
