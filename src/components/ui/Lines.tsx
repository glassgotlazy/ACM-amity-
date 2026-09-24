import { Fragment } from "react";
import { lines } from "@/lib/cms/types";

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
