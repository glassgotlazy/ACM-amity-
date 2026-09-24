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
 * A signed-in admin. There is one shared password today, so every session
 * has the "owner" role; `actor` is the name typed at sign-in, used only to
 * attribute entries in the audit log (it is self-declared, not an identity).
 * The role travels with the session so per-role permissions can be added
 * later without changing any route.
 */
export type AdminRole = "owner";
export type Session = { actor: string; role: AdminRole; expiresAt: number };

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

/** Token: `expiry.actor.signature`, the signature covering expiry and actor. */
export async function issueToken(secret: string, actor = "Admin"): Promise<string> {
  const expiry = String(Date.now() + SESSION_HOURS * 3600_000);
  const who = b64url(cleanActor(actor));
  return `${expiry}.${who}.${await hmac(secret, `${expiry}.${who}`)}`;
}

export async function readSession(secret: string, token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [expiry, who, sig] = parts;
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now() || !/^[\w-]{1,120}$/.test(who)) return null;
  if (!safeEqual(sig, await hmac(secret, `${expiry}.${who}`))) return null;
  let actor = "Admin";
  try {
    actor = cleanActor(unb64url(who));
  } catch {
    return null;
  }
  return { actor, role: "owner", expiresAt: Number(expiry) };
}

export async function verifyToken(secret: string, token: string | undefined): Promise<boolean> {
  return (await readSession(secret, token)) !== null;
}
