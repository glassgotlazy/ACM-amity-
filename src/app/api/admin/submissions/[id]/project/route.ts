import { handle } from "../../../cms/_handle";
import { audit } from "@/lib/audit";
import { ROLES } from "@/data/taxonomy";
import { getProblems } from "@/lib/cms/read";
import { CmsError, createRow, listRows } from "@/lib/cms/write";
import { getSubmission } from "@/lib/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70) || "project";

/**
 * Turns a project proposal into a draft project, pre-filled from what the
 * student wrote. The draft is unpublished — nothing appears on the site until
 * an admin reviews it under Projects and publishes it. The proposal itself is
 * left as it is; its status is the admin's call.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, "content:write", async (session) => {
    const { id } = await params;
    if (!UUID.test(id)) throw new CmsError(400, "bad_id");
    const sub = await getSubmission(id);
    if (!sub) throw new CmsError(404, "not_found");
    if (sub.kind !== "project-proposal") throw new CmsError(400, "not_a_proposal");

    const p = sub.payload as Record<string, unknown>;
    const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string).trim() : "");
    const name = str("name").slice(0, 120) || "Untitled proposal";

    const taken = new Set((await listRows("projects")).map((r) => String((r as { slug?: unknown }).slug)));
    let slug = slugify(name);
    for (let n = 2; taken.has(slug); n++) slug = `${slugify(name)}-${n}`;

    const problem = (await getProblems()).find((pr) => pr.title === str("problem"));
    const roles = (Array.isArray(p.roles) ? p.roles : []).filter((r): r is (typeof ROLES)[number] =>
      (ROLES as readonly string[]).includes(String(r)),
    );

    const created = await createRow(
      "projects",
      {
        name,
        slug,
        category: "",
        status: "proposed",
        summary: (str("concept") || name).slice(0, 400),
        problem: str("outcome").slice(0, 1500),
        problem_slug: problem?.slug ?? null,
        image_url: null,
        repo_url: "",
        live_url: "",
        progress: 0,
        featured: false,
        published: false,
        domains: [],
        technologies: str("technologies")
          .split(/[,\n]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20),
        building: [],
        exists_now: [],
        not_yet: ["No code has been written yet — this project came from a proposal."],
        contribute: [],
        timeline: [],
        open_roles: roles.map((role) => ({ role, level: "Any", what: "" })),
        members: [{ member_id: null, name: "Open", role: "Project lead" }],
      },
      session.actor,
    );
    await audit({ actor: session.actor, action: "create", entity: "projects", entity_id: String(created.id), summary: `Drafted project “${name}” from a proposal` });
    return { project: { id: created.id, slug } };
  });
}
