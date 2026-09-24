import { Fragment } from "react";
import { lines } from "@/lib/cms/types";

/** A CMS page title; `accentLast` sets its final line in the accent colour. */
export function CmsTitle({ text, accentLast }: { text: string; accentLast?: boolean }) {
  const all = lines(text);
  return (
    <>
      {all.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {accentLast && all.length > 1 && i === all.length - 1 ? <span className="text-acm-bright">{line}</span> : line}
        </Fragment>
      ))}
    </>
  );
}

/** A CMS headline rendered with its line breaks. */
export function Lines({ text }: { text: string }) {
  return (
    <>
      {lines(text).map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}
