import { githubRepos, importGithubActivity } from "@/lib/github-activity";
import { handle } from "../cms/_handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Whether the import is configured, and which repositories it reads. */
export async function GET(request: Request) {
  return handle(request, "content:write", async () => ({
    repos: githubRepos(),
    autoPublish: process.env.GITHUB_AUTO_PUBLISH === "true",
    scheduled: Boolean(process.env.CRON_SECRET),
  }));
}

/** "Import now" from the Activity log page: the last 30 days. */
export async function POST(request: Request) {
  return handle(request, "content:write", async (s) => importGithubActivity(s.actor, 30));
}
