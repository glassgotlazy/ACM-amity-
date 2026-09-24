import { Fragment } from "react";
import { lines } from "@/lib/cms/types";
import { displayCase } from "@/lib/display-case";

/**
 * A CMS page title with its line breaks. (`accentLast` used to colour the
 * last line; one highlighted line in a headline reads as a template, so it
 * is accepted and ignored.)
 */
export function CmsTitle({ text }: { text: string; accentLast?: boolean }) {
  const all = lines(displayCase(text));
  return (
    <>
      {all.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}

/** A CMS headline rendered with its line breaks. */
export function Lines({ text }: { text: string }) {
  return (
    <>
      {lines(displayCase(text)).map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}
