/**
 * Admin session tokens.
 *
 * One shared password, no user accounts. A successful sign-in issues a
 * cookie holding `expiry.signature`, where the signature is an HMAC over the
 * expiry using the password as key material. Middleware recomputes it on
 * every /admin request, so the cookie cannot be forged or extended without
 * the password, and there is nothing to store server-side.
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

export async function issueToken(secret: string): Promise<string> {
  const expiry = String(Date.now() + SESSION_HOURS * 3600_000);
  return `${expiry}.${await hmac(secret, expiry)}`;
}

export async function verifyToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const expiry = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return false;
  return safeEqual(sig, await hmac(secret, expiry));
}
