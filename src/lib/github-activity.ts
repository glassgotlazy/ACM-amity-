import { revalidateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { CMS_TAGS } from "@/lib/cms/read";
import { contentStatus } from "@/lib/cms/write";
import { rest, StorageError } from "@/lib/supabase";

/**
 * Imports recent commits from the club's GitHub repositories into the
 * activity log, so it keeps itself current. Configured with:
 *   GITHUB_REPOS         owner/repo, comma-separated (required to switch it on)
 *   GITHUB_TOKEN         optional; raises GitHub's rate limit, and is needed for private repos
 *   GITHUB_AUTO_PUBLISH  "true" to show imported entries straight away;
 *                        otherwise they arrive as drafts to review under Activity log.
 * Each commit is imported once (activity_items.source_ref, from supabase/v3.sql).
 */

type Commit = {
  sha: string;
  html_url: string;
  parents: unknown[];
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string } | null;
};

export type ImportResult =
  | { ok: true; added: number; skipped: number; repos: string[] }
  | { ok: false; reason: "not_configured" | "v3_missing" | "content_not_loaded" | "github_failed"; detail?: string };

export function githubRepos(): string[] {
  return (process.env.GITHUB_REPOS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter((r) => /^[\w.-]+\/[\w.-]+$/.test(r))
    .slice(0, 10);
}

const DAY = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });

async function fetchCommits(repo: string, since: string): Promise<Commit[]> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "acm-buildhub" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=30&since=${encodeURIComponent(since)}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${repo}: GitHub answered ${res.status}`);
  return (await res.json()) as Commit[];
}

export async function importGithubActivity(actor: string, days = 7): Promise<ImportResult> {
  const repos = githubRepos();
  if (!repos.length) return { ok: false, reason: "not_configured" };
  if ((await contentStatus()).activity !== "ready") return { ok: false, reason: "content_not_loaded" };
  try {
    await rest("activity_items?select=source_ref&limit=1");
  } catch (error) {
    if (error instanceof StorageError && (error.status === 400 || error.status === 404)) return { ok: false, reason: "v3_missing" };
    throw error;
  }

  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const found: { ref: string; repo: string; c: Commit }[] = [];
  try {
    for (const repo of repos) {
      for (const c of await fetchCommits(repo, since)) {
        if (c.parents.length > 1 || !c.commit.author) continue; // merge commits say nothing new
        found.push({ ref: `gh:${repo}@${c.sha}`, repo, c });
      }
    }
  } catch (error) {
    return { ok: false, reason: "github_failed", detail: error instanceof Error ? error.message.slice(0, 200) : undefined };
  }
  if (!found.length) return { ok: true, added: 0, skipped: 0, repos };

  const existing = new Set<string>();
  for (let i = 0; i < found.length; i += 50) {
    const refs = found.slice(i, i + 50).map((f) => `"${f.ref}"`).join(",");
    const rows = await rest<{ source_ref: string }[]>(`activity_items?select=source_ref&source_ref=in.(${encodeURIComponent(refs)})`);
    rows.forEach((r) => existing.add(r.source_ref));
    // An entry an admin deleted stays deleted: its copy in the history counts as seen.
    const gone = await rest<{ ref: string }[]>(
      `content_versions?select=ref:data->>source_ref&resource=eq.activity&action=eq.delete&data->>source_ref=in.(${encodeURIComponent(refs)})`,
    ).catch(() => []);
    gone.forEach((r) => existing.add(r.ref));
  }
  const fresh = found.filter((f) => !existing.has(f.ref)).sort((a, b) => b.c.commit.author!.date.localeCompare(a.c.commit.author!.date));
  if (!fresh.length) return { ok: true, added: 0, skipped: found.length, repos };

  // Newest first, above everything already in the log.
  const [top] = await rest<{ sort: number }[]>("activity_items?select=sort&order=sort.asc&limit=1");
  const start = (top?.sort ?? 0) - fresh.length;
  const publish = process.env.GITHUB_AUTO_PUBLISH === "true";
  await rest("activity_items", {
    method: "POST",
    body: JSON.stringify(
      fresh.map((f, i) => {
        const when = new Date(f.c.commit.author!.date);
        const subject = f.c.commit.message.split("\n")[0].trim().slice(0, 300);
        return {
          kind: "build",
          text: subject || "Pushed a commit",
          actor: (f.c.author?.login ?? f.c.commit.author!.name).slice(0, 80),
          target_label: f.repo.split("/")[1].slice(0, 80),
          target_href: f.c.html_url.slice(0, 300),
          when_label: TIME.format(when).toUpperCase(),
          day_label: DAY.format(when),
          published: publish,
          sort: start + i,
          source_ref: f.ref,
        };
      }),
    ),
  });
  revalidateTag(CMS_TAGS.activity);
  await audit({
    actor,
    action: "create",
    entity: "activity",
    summary: `Imported ${fresh.length} commit${fresh.length === 1 ? "" : "s"} from GitHub${publish ? "" : " as drafts"}`,
  });
  return { ok: true, added: fresh.length, skipped: found.length - fresh.length, repos };
}
