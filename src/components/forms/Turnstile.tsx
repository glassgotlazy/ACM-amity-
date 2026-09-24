"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile widget for the public forms. Renders nothing when no
 * site key is configured. Usually passes without the visitor doing anything.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !holder.current || !window.turnstile || widget.current) return;
      const dark = document.documentElement.getAttribute("data-theme") !== "light";
      widget.current = window.turnstile.render(holder.current, {
        sitekey: SITE_KEY,
        theme: dark ? "dark" : "light",
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(null),
        "error-callback": () => setToken(null),
      });
    };
    if (window.turnstile) mount();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!s) {
        s = document.createElement("script");
        s.src = SCRIPT;
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  return {
    enabled: Boolean(SITE_KEY),
    token,
    /** Ready to submit: no check configured, or the check has passed. */
    ready: !SITE_KEY || Boolean(token),
    reset: () => {
      setToken(null);
      if (widget.current) window.turnstile?.reset(widget.current);
    },
    element: SITE_KEY ? <div ref={holder} className="min-h-[65px]" aria-label="Spam check" /> : null,
  };
}
