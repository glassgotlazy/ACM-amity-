"use client";

import { useState } from "react";

export function SignOut() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      // Hard navigation for the same reason as sign-in: the cached client
      // tree for /admin must not survive the cookie being cleared.
      window.location.assign("/admin/login");
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="shrink-0 px-4 py-2 font-mono text-label uppercase text-ink-faint transition-colors duration-200 hover:text-acm-bright disabled:opacity-50"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
