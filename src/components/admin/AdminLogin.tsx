"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TextField } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

export function AdminLogin() {
  const params = useSearchParams();
  const unconfigured = params.get("unconfigured") === "1";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!password) {
      setError("Enter the admin password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Hard navigation on purpose. The client router prefetches /admin
        // while this page is open and caches its 307 → /admin/login; a soft
        // router.replace("/admin") then serves that cached redirect and never
        // asks the server, leaving the user on the login page with a valid
        // cookie. Crossing an auth boundary must hit middleware.
        window.location.assign("/admin");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        data.error === "not_configured"
          ? "No admin password is configured for this deployment."
          : "That password is not right.",
      );
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-md space-y-7">
      {unconfigured ? (
        <p role="alert" className="border border-line px-5 py-4 font-mono text-micro uppercase leading-relaxed text-ink-faint">
          <span className="text-acm-bright">Locked ·</span> No admin password is configured, so this view is
          unreachable. Set ADMIN_PASSWORD in the deployment and redeploy.
        </p>
      ) : null}

      <TextField
        label="Admin password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        error={error ?? undefined}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
        disabled={unconfigured || busy}
      />

      <div className="flex flex-wrap items-center gap-5 border-t border-line pt-7">
        <Button type="submit" size="lg" arrow disabled={unconfigured || busy}>
          {busy ? "Checking…" : "Sign in"}
        </Button>
        <span className="font-mono text-micro uppercase text-ink-ghost">Session lasts 12 hours</span>
      </div>
    </form>
  );
}
