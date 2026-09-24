/**
 * Admin session tokens.
 *
 * One shared password, no user accounts. A successful sign-in issues a
 * cookie holding `expiry.actor.signature`, where the signature is an HMAC
 * over expiry and actor using the password as key material. Middleware and
 * every admin API route recompute it, so the cookie cannot be forged,
 * extended or re-attributed without the password, and there is nothing to
 * store server-side. Changing ADMIN_PASSWORD signs every session out.
 *
 * Web Crypto rather than node:crypto so the same code runs in Edge middleware
 * and the Node route handler.
 */

export const ADMIN_COOKIE = "acm_admin";
export const SESSION_HOURS = 12;

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison; a plain `===` leaks length and prefix. */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

/**
 * A signed-in admin. The shared ADMIN_PASSWORD signs in as "owner"; people
 * with their own account (table admin_users) sign in with email + password
 * and carry their role and account id. `version` lets an owner sign someone
 * out everywhere: the API compares it with the account's current version.
 */
export const ADMIN_ROLES = ["owner", "editor", "events", "reviewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type Session = { actor: string; role: AdminRole; userId: string | null; version: number; expiresAt: number };

const b64url = (s: string) =>
  btoa(String.fromCharCode(...encoder.encode(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

/** Letters, digits, spaces and a little punctuation; at most 40 characters. */
export function cleanActor(name: unknown): string {
  const s = typeof name === "string" ? name.normalize("NFKC").replace(/[^\p{L}\p{N} .'-]/gu, "").trim() : "";
  return s.slice(0, 40) || "Admin";
}

/** Token: `expiry.payload.signature`, the signature covering expiry and payload. */
export async function issueToken(
  secret: string,
  who: { actor: string; role?: AdminRole; userId?: string | null; version?: number } = { actor: "Admin" },
): Promise<string> {
  const expiry = String(Date.now() + SESSION_HOURS * 3600_000);
  const payload = b64url(
    JSON.stringify({ a: cleanActor(who.actor), r: who.role ?? "owner", u: who.userId ?? null, v: who.version ?? 0 }),
  );
  return `${expiry}.${payload}.${await hmac(secret, `${expiry}.${payload}`)}`;
}

export async function readSession(secret: string, token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [expiry, payload, sig] = parts;
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now() || !/^[\w-]{1,400}$/.test(payload)) return null;
  if (!safeEqual(sig, await hmac(secret, `${expiry}.${payload}`))) return null;
  try {
    const p = JSON.parse(unb64url(payload)) as { a?: unknown; r?: unknown; u?: unknown; v?: unknown };
    const role = (ADMIN_ROLES as readonly string[]).includes(String(p.r)) ? (p.r as AdminRole) : null;
    if (!role) return null;
    return {
      actor: cleanActor(p.a),
      role,
      userId: typeof p.u === "string" ? p.u : null,
      version: typeof p.v === "number" ? p.v : 0,
      expiresAt: Number(expiry),
    };
  } catch {
    return null;
  }
}

export async function verifyToken(secret: string, token: string | undefined): Promise<boolean> {
  return (await readSession(secret, token)) !== null;
}
