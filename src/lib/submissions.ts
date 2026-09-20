/**
 * Client half of the submission path. Every form goes through here, so there
 * is one place that knows how a submission is delivered and one shape of
 * result for the UI to render.
 */

export type SubmissionKind = "join" | "project-application" | "problem-submission" | "project-proposal";

export type SubmissionResult =
  /** Stored at the configured destination. */
  | { status: "delivered" }
  /** No destination configured — the form is a working demo. */
  | { status: "not-configured" }
  /** A destination exists but the attempt failed; the user must be told. */
  | { status: "failed"; message: string };

export async function submitForm(
  kind: SubmissionKind,
  payload: Record<string, string | string[] | boolean>,
  trap: string,
): Promise<SubmissionResult> {
  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, payload, trap }),
    });

    const data = (await response.json()) as { delivered?: boolean; mode?: string };

    if (data.delivered) return { status: "delivered" };
    if (data.mode === "not-configured") return { status: "not-configured" };

    return {
      status: "failed",
      message: "We could not record that just now. Please try again in a moment.",
    };
  } catch {
    return {
      status: "failed",
      message: "That did not send — check your connection and try again.",
    };
  }
}

/** Shared props for the hidden honeypot input every form renders. */
export const TRAP_FIELD = "company-website";

export const trapProps = {
  name: TRAP_FIELD,
  tabIndex: -1,
  autoComplete: "off",
  "aria-hidden": true as const,
  className: "absolute left-[-9999px] h-px w-px opacity-0",
};
