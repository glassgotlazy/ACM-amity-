/**
 * Cloudflare Turnstile (spam check on the public forms). Optional: the check
 * runs only when BOTH keys are set. With just the secret, the browser would
 * never show the widget and every form would be refused, so a half-finished
 * setup is treated as "off" (and logged). The site key is public by design;
 * the secret is server-only.
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   shown in the browser widget
 *   TURNSTILE_SECRET_KEY             used here to verify the token
 */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: unknown, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not; the spam check is off until both are set.");
    return true;
  }
  if (typeof token !== "string" || !token || token.length > 4096) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // If Cloudflare is unreachable, fail closed: the honeypot alone is not enough.
    console.error("[turnstile] verify failed:", error);
    return false;
  }
}
