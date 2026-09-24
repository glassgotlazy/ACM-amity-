"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { SubmissionKind } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Queue } from "./Queue";

const TABS: { kind: SubmissionKind; label: string }[] = [
  { kind: "project-application", label: "Applications" },
  { kind: "problem-submission", label: "Problem submissions" },
  { kind: "project-proposal", label: "Proposals" },
  { kind: "join", label: "Members" },
];

function Tabs() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (TABS.find((t) => t.kind === params.get("tab")) ?? TABS[0]).kind;

  return (
    <div>
      <div role="tablist" aria-label="Submission type" className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            role="tab"
            aria-selected={current === t.kind}
            onClick={() => router.replace(`/admin/submissions?tab=${t.kind}`, { scroll: false })}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 font-mono text-label uppercase transition-colors",
              current === t.kind ? "border-acm text-ink" : "border-transparent text-ink-faint hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-8">
        <Queue key={current} kind={current} />
      </div>
    </div>
  );
}

/** The queue from before the CMS, unchanged, one tab per submission kind. */
export function Submissions() {
  return (
    <Suspense fallback={null}>
      <Tabs />
    </Suspense>
  );
}
