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
  const [failed, setFailed] = useState(false);
  // A callback ref, not useRef: in multi-step forms the widget's spot only
  // appears on the last step, so the widget must render whenever the spot
  // mounts, not just when the form does.
  const [holder, setHolder] = useState<HTMLDivElement | null>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !holder) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !window.turnstile || widget.current) return;
      const dark = document.documentElement.getAttribute("data-theme") !== "light";
      widget.current = window.turnstile.render(holder, {
        sitekey: SITE_KEY,
        theme: dark ? "dark" : "light",
        callback: (t: string) => {
          setFailed(false);
          setToken(t);
        },
        "expired-callback": () => setToken(null),
        "error-callback": () => {
          setToken(null);
          setFailed(true);
        },
      });
    };
    const onError = () => !cancelled && setFailed(true);
    let script: HTMLScriptElement | null = null;
    if (window.turnstile) mount();
    else {
      script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
      script.addEventListener("error", onError);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", mount);
      script?.removeEventListener("error", onError);
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
      setToken(null);
    };
  }, [holder]);

  return {
    enabled: Boolean(SITE_KEY),
    token,
    /** Ready to submit: no check configured, or the check has passed. */
    ready: !SITE_KEY || Boolean(token),
    reset: () => {
      setToken(null);
      if (widget.current) window.turnstile?.reset(widget.current);
    },
    element: SITE_KEY ? (
      <div>
        <div ref={setHolder} className="min-h-[65px]" aria-label="Spam check" />
        {failed ? (
          <p role="alert" className="mt-2 text-sm text-acm-bright">
            The spam check could not load. Turn off any ad or script blocker for this site, then reload the page.
          </p>
        ) : !token ? (
          <p className="mt-2 text-xs text-ink-faint">Checking you are not a robot… this usually takes a second.</p>
        ) : null}
      </div>
    ) : null,
  };
}
