import { handle } from "../../cms/_handle";
import { audit } from "@/lib/audit";
import { KIND_LABEL, STATE_LABEL } from "@/lib/submission-types";
import { exportSubmissions, parseQuery } from "@/lib/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A spreadsheet cell that starts with = + - @ (or a tab/CR) is run as a
 * formula by Excel and Sheets. Submissions are public input, so prefix those
 * with an apostrophe before quoting.
 */
function cell(value: unknown): string {
  let s = Array.isArray(value) ? value.join("; ") : value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV of every submission matching the current filters (at most 5,000). */
export async function GET(request: Request) {
  return handle(request, "submissions:read", async (session) => {
    const query = parseQuery(new URL(request.url).searchParams);
    const rows = await exportSubmissions(query);
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r.payload ?? {})))].filter((k) => k !== "anonymous").sort();
    const head = ["id", "received", "type", "status", "anonymous", "note", ...keys];
    const lines = [
      head.map(cell).join(","),
      ...rows.map((r) =>
        [r.id, r.created_at, KIND_LABEL[r.kind], STATE_LABEL[r.state], r.anonymous ? "yes" : "no", r.note, ...keys.map((k) => r.payload?.[k])]
          .map(cell)
          .join(","),
      ),
    ];
    await audit({ actor: session.actor, action: "export", entity: "submission", summary: `Exported ${rows.length} submissions as CSV` });
    return new Response(`﻿${lines.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
