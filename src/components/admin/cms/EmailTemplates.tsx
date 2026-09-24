"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, explain } from "./api";
import { Btn, ErrorState, LoadingRows, Notice, TextArea, TextInput, useToast } from "./kit";

type Template = { key: "accepted" | "declined" | "reviewing"; subject: string; body: string };
type Data = { templates: Record<Template["key"], Template>; defaults: Record<Template["key"], Template>; configured: boolean; alerts: boolean };

type TestResult = { ok: boolean; to: string[]; error?: string };

const LABEL: Record<Template["key"], string> = {
  accepted: "When a submission is accepted",
  declined: "When a submission is declined",
  reviewing: "When a submission moves to review",
};

/** Emails sent to applicants when an admin changes a status and ticks "Email the applicant". */
export function EmailTemplates() {
  const toast = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [drafts, setDrafts] = useState<Record<string, Template>>({});
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await api<Data>("/api/admin/cms/email-templates");
      setData(d);
      setDrafts(d.templates);
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function sendTest() {
    setTesting(true);
    setTest(null);
    try {
      setTest(await api<TestResult>("/api/admin/email-test", { method: "POST" }));
    } catch (e) {
      setTest({ ok: false, to: [], error: explain(e) });
    } finally {
      setTesting(false);
    }
  }

  if (error) return <ErrorState error={error} retry={load} />;
  if (!data) return <LoadingRows rows={3} />;

  async function save(key: Template["key"]) {
    setSaving(key);
    setErrors((e) => ({ ...e, [key]: {} }));
    try {
      await api("/api/admin/cms/email-templates", { method: "PUT", json: drafts[key] });
      toast("ok", "Email template saved.");
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid") setErrors((x) => ({ ...x, [key]: e.errors }));
      toast("error", explain(e));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="border border-line bg-surface p-5">
        <h2 className="text-base font-semibold">Test email setup</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Sends a test message to the admin alert address (<code className="font-mono text-ink">ALERT_EMAIL_TO</code>) and shows what happened.
        </p>
        <Btn className="mt-4" onClick={sendTest} disabled={testing}>
          {testing ? "Sending…" : "Send test email"}
        </Btn>
        {test ? (
          test.ok ? (
            <p role="status" className="mt-3 text-sm text-signal-live">
              Sent to {test.to.join(", ")}. Check that inbox (and its spam folder) in a minute.
            </p>
          ) : (
            <p role="alert" className="mt-3 text-sm text-acm-bright">
              Not sent{test.to.length ? ` to ${test.to.join(", ")}` : ""}. {test.error}
            </p>
          )
        ) : null}
      </section>
      {!data.configured ? (
        <Notice tone="warn" title="Email is not switched on">
          Add <code className="font-mono text-ink">RESEND_API_KEY</code> and <code className="font-mono text-ink">EMAIL_FROM</code> in
          Vercel → Settings → Environment Variables, then redeploy. Until then nothing is sent. Add{" "}
          <code className="font-mono text-ink">ALERT_EMAIL_TO</code> to be told about new submissions.
        </Notice>
      ) : (
        <Notice title="Email is on">
          Applicants are emailed only when you tick “Email the applicant” while changing a status.
          {data.alerts ? " New submissions are sent to ALERT_EMAIL_TO." : " Set ALERT_EMAIL_TO to be told about new submissions."}
        </Notice>
      )}
      <p className="text-sm text-ink-muted">
        Placeholders: <code className="font-mono text-ink">{"{name}"}</code> the applicant,{" "}
        <code className="font-mono text-ink">{"{kind}"}</code> e.g. “project application”,{" "}
        <code className="font-mono text-ink">{"{title}"}</code> what they sent, <code className="font-mono text-ink">{"{site}"}</code> the site
        name.
      </p>
      {(Object.keys(LABEL) as Template["key"][]).map((key) => (
        <section key={key} aria-labelledby={`tpl-${key}`} className="space-y-4 border-t border-line pt-6">
          <h3 id={`tpl-${key}`} className="font-mono text-label uppercase text-ink">
            {LABEL[key]}
          </h3>
          <TextInput
            label="Subject"
            value={drafts[key]?.subject ?? ""}
            onChange={(v) => setDrafts((d) => ({ ...d, [key]: { ...d[key], subject: v } }))}
            error={errors[key]?.subject}
            maxLength={200}
          />
          <TextArea
            label="Message"
            rows={7}
            value={drafts[key]?.body ?? ""}
            onChange={(v) => setDrafts((d) => ({ ...d, [key]: { ...d[key], body: v } }))}
            error={errors[key]?.body}
            maxLength={4000}
          />
          <div className="flex flex-wrap gap-2">
            <Btn tone="primary" onClick={() => save(key)} disabled={saving === key}>
              {saving === key ? "Saving…" : "Save email"}
            </Btn>
            <Btn tone="ghost" onClick={() => setDrafts((d) => ({ ...d, [key]: data.defaults[key] }))}>
              Reset to default text
            </Btn>
          </div>
        </section>
      ))}
    </div>
  );
}
