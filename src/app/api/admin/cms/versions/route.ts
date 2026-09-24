import { resourcePermission, type Permission } from "@/lib/admin-permissions";
import { CmsError, checkId, listDeleted, listVersions, resource, restoreVersion } from "@/lib/cms/write";
import { handle, json } from "../_handle";

/** Settings and page sections are edited under "settings"; collections by their own permission. */
function permissionFor(name: string): Permission {
  return name === "settings" || name === "section" ? "settings:write" : resourcePermission(name);
}

function checkTarget(name: string, id: string | null) {
  if (name === "settings") return;
  if (name === "section") {
    if (!id || !/^[a-z_]{1,40}$/.test(id)) throw new CmsError(400, "invalid_body");
    return;
  }
  resource(name);
  if (id) checkId(id);
}

/**
 * History of one item: GET ?resource=events&id=<uuid>
 * Deleted items of a collection: GET ?resource=events&deleted=1
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const name = params.get("resource") ?? "";
  const id = params.get("id");
  return handle(req, permissionFor(name), async () => {
    checkTarget(name, id);
    if (params.get("deleted") === "1") {
      if (name === "settings" || name === "section") throw new CmsError(400, "invalid_body");
      const versions = await listDeleted(name);
      return { ready: versions !== null, versions: versions ?? [] };
    }
    const versions = await listVersions(name, name === "settings" ? "1" : (id ?? ""));
    return { ready: versions !== null, versions: versions ?? [] };
  });
}

/** Restore: POST { resource, version_id }. */
export async function POST(req: Request) {
  const body = (await req.clone().json().catch(() => ({}))) as { resource?: unknown };
  const name = typeof body.resource === "string" ? body.resource : "";
  return handle(req, permissionFor(name), async (s) => {
    const input = (await json(req)) as { version_id?: unknown };
    checkTarget(name, null);
    const versionId = Number(input.version_id);
    if (!Number.isSafeInteger(versionId) || versionId <= 0) throw new CmsError(400, "invalid_body");
    return { row: await restoreVersion(versionId, name, s.actor) };
  });
}

