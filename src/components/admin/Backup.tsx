"use client";

import type { AdminRole } from "@/lib/admin-auth";
import { can } from "@/lib/admin-permissions";
import { Notice, useCms } from "./cms/kit";

/** Owner-only: download the whole database, and how the weekly copy works. */
export function Backup() {
  const { role } = useCms();
  if (role && !can(role as AdminRole, "backup:read")) {
    return <Notice tone="warn" title="Owners only">Ask an owner to download a backup.</Notice>;
  }
  return (
    <div className="max-w-2xl space-y-8">
      <section className="border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Download now</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          One JSON file with every table: site content, submissions, email templates, admin accounts (without passwords) and the audit log. It
          contains applicants’ personal details — keep it private.
        </p>
        <a
          href="/api/admin/backup"
          download
          className="mt-5 inline-flex h-10 items-center bg-acm-solid px-4 font-mono text-label uppercase text-white transition-colors hover:bg-acm-deep"
        >
          Download backup
        </a>
      </section>
      <section className="border border-line p-6">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Weekly automatic backup</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          A GitHub Action (<code className="font-mono text-ink">.github/workflows/backup.yml</code>) saves an encrypted copy every Sunday and keeps
          each for 90 days, under the repository’s Actions tab. It needs three repository secrets: <code className="font-mono text-ink">SUPABASE_URL</code>,{" "}
          <code className="font-mono text-ink">SUPABASE_SERVICE_ROLE_KEY</code> and <code className="font-mono text-ink">BACKUP_PASSPHRASE</code>. To open
          one: <code className="font-mono text-ink">gpg --decrypt acm-backup.json.gpg &gt; backup.json</code>.
        </p>
      </section>
    </div>
  );
}
