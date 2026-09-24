import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { MEDIA_USES, checkImage, deleteMedia, isMediaPath, listMedia, uploadMedia, type MediaUse } from "@/lib/cms/media";
import { handle } from "../cms/_handle";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(req, "media:write", async () => ({ files: await listMedia() }));
}

/** multipart/form-data: `file` and `use` (logo, favicon, avatar, cover, qr). */
export async function POST(req: Request) {
  return handle(req, "media:write", async (session) => {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const use = String(form?.get("use") ?? "");
    if (!(use in MEDIA_USES)) throw new CmsError(400, "invalid_use");
    if (!(file instanceof Blob)) throw new CmsError(400, "no_file");
    // Checked before reading, so an oversized upload is not buffered in full.
    if (file.size > MEDIA_USES[use as MediaUse].maxBytes) {
      const rule = MEDIA_USES[use as MediaUse];
      throw new CmsError(422, "invalid", { file: `File is too large. The limit for a ${rule.label.toLowerCase()} is ${Math.round(rule.maxBytes / 1000)} KB.` });
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const info = checkImage(buf, use as MediaUse);
    if ("error" in info) throw new CmsError(422, "invalid", { file: info.error });
    const stored = await uploadMedia(buf, use as MediaUse, info.kind);
    await audit({ actor: session.actor, action: "upload", entity: "media", entity_id: stored.path, summary: `Uploaded ${MEDIA_USES[use as MediaUse].label.toLowerCase()} (${info.width}×${info.height})` });
    return { file: stored, width: info.width, height: info.height };
  });
}

export async function DELETE(req: Request) {
  return handle(req, "media:write", async (session) => {
    const path = new URL(req.url).searchParams.get("path") ?? "";
    if (!isMediaPath(path)) throw new CmsError(400, "invalid_path");
    await deleteMedia(path);
    await audit({ actor: session.actor, action: "delete", entity: "media", entity_id: path, summary: `Deleted image ${path}` });
  });
}
