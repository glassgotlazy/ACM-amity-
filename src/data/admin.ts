/**
 * Admin helpers. Applications and problem submissions come from storage now
 * (see src/lib/supabase.ts); the only figure still without a real source is
 * the contributor count, which is labelled as such in the tile.
 */

export function buildStats(input: {
  projects: number;
  needLeads: number;
  openRoles: number;
  contributors: number;
  newApplications: number | null;
  queuedSubmissions: number | null;
}) {
  const live = (n: number | null) => (n === null ? "—" : n);
  return [
    {
      label: "Applications",
      value: live(input.newApplications),
      delta: input.newApplications === null ? "storage not configured" : "unopened",
    },
    { label: "Active projects", value: input.projects, delta: `${input.needLeads} need leads` },
    { label: "Open roles", value: input.openRoles, delta: `across ${input.projects} projects` },
    { label: "Contributors", value: input.contributors, delta: "demo figure" },
    {
      label: "Problem submissions",
      value: live(input.queuedSubmissions),
      delta: input.queuedSubmissions === null ? "storage not configured" : "awaiting review",
    },
  ];
}
