import { storageConfig } from "@/lib/supabase";

/**
 * Media library on Supabase Storage (bucket `cms-media`, public read).
 *
 * Uploads only ever happen here, on the server, with the service key. The
 * file's real type and dimensions are read from its bytes — the browser's
 * claimed MIME type and file name are not trusted.
 */

export const MEDIA_BUCKET = "cms-media";

export function publicMediaPrefix(): string | null {
  const cfg = storageConfig();
  return cfg ? `${cfg.url}/storage/v1/object/public/${MEDIA_BUCKET}/` : null;
}

type Kind = "png" | "jpeg" | "webp" | "ico";

export const MEDIA_TYPES: Record<Kind, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
};

/**
 * What each kind of image may be. Limits are generous enough for a phone
 * photo but stop a 40 MB original from landing on the homepage.
 */
export const MEDIA_USES = {
  logo: { label: "Logo", types: ["png", "webp", "jpeg"], maxBytes: 1_000_000, min: [32, 32], max: [2000, 2000] },
  favicon: { label: "Favicon", types: ["png", "ico"], maxBytes: 256_000, min: [16, 16], max: [512, 512], square: true },
  avatar: { label: "Team photo", types: ["jpeg", "png", "webp"], maxBytes: 2_000_000, min: [160, 160], max: [4000, 4000] },
  cover: { label: "Event / project / hero image", types: ["jpeg", "png", "webp"], maxBytes: 2_000_000, min: [480, 240], max: [5000, 5000] },
  qr: { label: "QR code", types: ["png", "webp"], maxBytes: 500_000, min: [200, 200], max: [2000, 2000], square: true },
} as const satisfies Record<
  string,
  { label: string; types: readonly Kind[]; maxBytes: number; min: readonly [number, number]; max: readonly [number, number]; square?: boolean }
>;
export type MediaUse = keyof typeof MEDIA_USES;

/** Reads type and pixel size from the file header. Null for anything else. */
export function imageInfo(buf: Uint8Array): { kind: Kind; width: number; height: number } | null {
  const u16be = (o: number) => (buf[o] << 8) | buf[o + 1];
  const u16le = (o: number) => buf[o] | (buf[o + 1] << 8);
  const u24le = (o: number) => buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16);
  const u32be = (o: number) => ((buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3]) >>> 0;
  const ascii = (o: number, n: number) => String.fromCharCode(...buf.subarray(o, o + n));

  if (buf.length >= 24 && buf[0] === 0x89 && ascii(1, 3) === "PNG" && ascii(12, 4) === "IHDR") {
    return { kind: "png", width: u32be(16), height: u32be(20) };
  }

  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) return null;
      const marker = buf[o + 1];
      // Start-of-frame markers carry the dimensions (excluding DHT/JPG/DAC).
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { kind: "jpeg", height: u16be(o + 5), width: u16be(o + 7) };
      }
      o += 2 + u16be(o + 2);
    }
    return null;
  }

  if (buf.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8 ") return { kind: "webp", width: u16le(26) & 0x3fff, height: u16le(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = buf.subarray(21, 25);
      return {
        kind: "webp",
        width: 1 + (((b[1] & 0x3f) << 8) | b[0]),
        height: 1 + (((b[3] & 0x0f) << 10) | (b[2] << 2) | ((b[1] & 0xc0) >> 6)),
      };
    }
    if (chunk === "VP8X") return { kind: "webp", width: 1 + u24le(24), height: 1 + u24le(27) };
    return null;
  }

  if (buf.length >= 22 && buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0 && u16le(4) > 0) {
    return { kind: "ico", width: buf[6] || 256, height: buf[7] || 256 };
  }

  return null;
}

/** Null when the file is acceptable for `use`, otherwise the reason it is not. */
export function checkImage(buf: Uint8Array, use: MediaUse): { error: string } | { kind: Kind; width: number; height: number } {
  const rule = MEDIA_USES[use];
  if (buf.length > rule.maxBytes) return { error: `File is too large. The limit for a ${rule.label.toLowerCase()} is ${Math.round(rule.maxBytes / 1000)} KB.` };
  const info = imageInfo(buf);
  if (!info) return { error: "Not a supported image. Use PNG, JPEG or WebP (ICO for favicons)." };
  if (!(rule.types as readonly Kind[]).includes(info.kind))
    return { error: `A ${rule.label.toLowerCase()} must be ${rule.types.map((t) => t.toUpperCase()).join(" or ")}.` };
  const [minW, minH] = rule.min;
  const [maxW, maxH] = rule.max;
  if (info.width < minW || info.height < minH) return { error: `Image is too small: at least ${minW}×${minH} pixels.` };
  if (info.width > maxW || info.height > maxH) return { error: `Image is too large: at most ${maxW}×${maxH} pixels.` };
  if ("square" in rule && rule.square && info.width !== info.height) return { error: "Image must be square." };
  return info;
}

async function storage(path: string, init: RequestInit) {
  const cfg = storageConfig();
  if (!cfg) throw new Error("storage_not_configured");
  const res = await fetch(`${cfg.url}/storage/v1/${path}`, {
    ...init,
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    console.error(`[media] ${init.method ?? "GET"} ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
    throw new Error(`media_${res.status}`);
  }
  return res;
}

export type MediaFile = { path: string; url: string; size: number | null; created_at: string | null };

const FOLDERS = Object.keys(MEDIA_USES) as MediaUse[];

export async function listMedia(): Promise<MediaFile[]> {
  const prefix = publicMediaPrefix()!;
  const lists = await Promise.all(
    FOLDERS.map(async (folder) => {
      const res = await storage(`object/list/${MEDIA_BUCKET}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: folder, limit: 200, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
      });
      const rows = (await res.json()) as { name: string; created_at?: string; metadata?: { size?: number } | null }[];
      return rows
        .filter((r) => r.name && !r.name.startsWith(".") && r.metadata)
        .map((r) => ({
          path: `${folder}/${r.name}`,
          url: `${prefix}${folder}/${r.name}`,
          size: r.metadata?.size ?? null,
          created_at: r.created_at ?? null,
        }));
    }),
  );
  return lists.flat().sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function uploadMedia(buf: Uint8Array, use: MediaUse, kind: Kind): Promise<MediaFile> {
  const ext = kind === "jpeg" ? "jpg" : kind;
  const path = `${use}/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await storage(`object/${MEDIA_BUCKET}/${path}`, {
    method: "POST",
    headers: { "Content-Type": MEDIA_TYPES[kind], "Cache-Control": "31536000", "x-upsert": "false" },
    body: buf as unknown as BodyInit,
  });
  return { path, url: `${publicMediaPrefix()}${path}`, size: buf.length, created_at: new Date().toISOString() };
}

export function isMediaPath(path: string): boolean {
  return /^(logo|favicon|avatar|cover|qr)\/[a-z0-9-]+\.(png|jpg|webp|ico)$/.test(path);
}

export async function deleteMedia(path: string): Promise<void> {
  await storage(`object/${MEDIA_BUCKET}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
}
