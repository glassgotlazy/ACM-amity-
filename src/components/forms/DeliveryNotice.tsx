import type { SubmissionResult } from "@/lib/submissions";

/**
 * The footnote under every confirmation screen. It reports what actually
 * happened rather than a fixed message — the site must never tell a student
 * their application was received when no destination was configured.
 */
export function DeliveryNotice({ result }: { result: SubmissionResult }) {
  if (result.status === "delivered") {
    return (
      <p className="mt-6 border-t border-line pt-5 label-sm leading-relaxed text-ink-ghost">
        <span className="text-signal-live">Received ·</span> Your submission has been recorded and will be read by the
        team. You will not get an automated email.
      </p>
    );
  }

  return (
    <p className="mt-6 border-t border-line pt-5 label-sm leading-relaxed text-ink-ghost">
      <span className="text-acm-bright">Demo notice ·</span> No submission destination is configured for this deployment, so
      nothing was transmitted or stored. Set FORM_ENDPOINT to start collecting.
    </p>
  );
}

/** Inline error shown when a destination exists but delivery failed. */
export function DeliveryError({ message }: { message: string }) {
  return (
    <p role="alert" className="label-sm leading-relaxed text-acm-bright">
      {message}
    </p>
  );
}
