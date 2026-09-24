// API suite: admin accounts and roles, history/undo, bulk actions, preview,
// calendar exports, galleries, backups, cron and security probes.
// Run through tests/run.mjs, which starts the app and the Supabase mock.

const A = process.env.APP;
const M = process.env.MOCK;
const OWNER_PASSWORD = process.env.ADMIN_PASSWORD;

let failures = 0;
let passes = 0;
function ok(name, cond, detail = "") {
  if (cond) passes++;
  else failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond || !detail ? "" : `  ${String(detail).slice(0, 300)}`}`);
}

/** A tiny cookie-carrying client. */
function client() {
  const jar = new Map();
  async function call(path, { method = "GET", json, headers = {}, redirect = "manual" } = {}) {
    const res = await fetch(A + path, {
      method,
      redirect,
      headers: {
        ...(json !== undefined ? { "content-type": "application/json" } : {}),
        ...(jar.size ? { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i);
      const v = pair.slice(i + 1);
      if (v === "" || /max-age=0/i.test(c)) jar.delete(k);
      else jar.set(k, v);
    }
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: res.status, body, headers: res.headers };
  }
  return { call, jar };
}

const iso = (days) => new Date(Date.now() + days * 86400_000).toISOString();

// ---------------------------------------------------------------- setup
// The tables exist from the start (cms.sql, admin.sql and v3.sql all run).
await fetch(`${M}/__mock/create-cms`);
await fetch(`${M}/__mock/create-admin`);
const owner = client();
let r = await owner.call("/api/admin/session", { method: "POST", json: { password: OWNER_PASSWORD, name: "Owner" } });
ok("owner signs in with the shared password", r.status === 200 && owner.jar.has("acm_admin"));
r = await owner.call("/api/admin/cms/init", { method: "POST" });
ok("CMS initialised", r.status === 200, JSON.stringify(r.body));
r = await owner.call("/api/admin/cms/init-content", { method: "POST" });
ok("remaining content loaded", r.status === 200, JSON.stringify(r.body));
r = await owner.call("/api/admin/cms/status");
ok("status reports v3 tables", r.body?.v3 === true && r.body?.role === "owner" && r.body?.account === false);

// ---------------------------------------------------------------- security headers
r = await owner.call("/");
const csp = r.headers.get("content-security-policy") ?? "";
ok("CSP header on public pages", csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'self'") && csp.includes("object-src 'none'"));
ok("nosniff + referrer policy", r.headers.get("x-content-type-options") === "nosniff" && Boolean(r.headers.get("referrer-policy")));

// ---------------------------------------------------------------- admin accounts
const PW = "Str0ng-pass-phrase";
const mk = (name, email, role, password = PW) => owner.call("/api/admin/users", { method: "POST", json: { name, email, role, password } });
r = await mk("Weak", "weak@example.com", "editor", "short");
ok("weak password refused", r.status === 422 && r.body?.errors?.password);
r = await mk("Rhea Reviewer", "rhea@example.com", "reviewer");
ok("reviewer account created", r.status === 200 && r.body?.row?.role === "reviewer" && !("password_hash" in r.body.row));
const reviewerId = r.body?.row?.id;
r = await mk("Rhea Again", "RHEA@example.com", "editor");
ok("duplicate email refused (case-insensitive)", r.status === 409);
r = await mk("Eve Events", "eve@example.com", "events");
ok("events account created", r.status === 200);
r = await mk("Ed Editor", "ed@example.com", "editor");
ok("editor account created", r.status === 200);
const editorId = r.body?.row?.id;
r = await owner.call("/api/admin/users");
ok("list never includes password hashes", r.status === 200 && r.body.rows.length === 3 && !JSON.stringify(r.body).includes("scrypt"));

const reviewer = client();
r = await reviewer.call("/api/admin/session", { method: "POST", json: { email: "rhea@example.com", password: "wrong-password-1!" } });
ok("wrong password → 401", r.status === 401);
r = await reviewer.call("/api/admin/session", { method: "POST", json: { email: "nobody@example.com", password: PW } });
ok("unknown account → same 401", r.status === 401 && r.body?.error === "wrong_password");
r = await reviewer.call("/api/admin/session", { method: "POST", json: { email: "Rhea@Example.com", password: PW } });
ok("reviewer signs in with email", r.status === 200);
r = await reviewer.call("/api/admin/session");
ok("session reports role and account", r.body?.role === "reviewer" && r.body?.account === true && r.body?.actor === "Rhea Reviewer");
r = await reviewer.call("/api/admin/cms/settings", { method: "PUT", json: {} });
ok("reviewer cannot edit settings (403)", r.status === 403);
r = await reviewer.call("/api/admin/users");
ok("reviewer cannot manage admins (403)", r.status === 403);
r = await reviewer.call("/api/admin/backup");
ok("reviewer cannot download backups (403)", r.status === 403);
r = await reviewer.call("/api/admin/submissions");
ok("reviewer can read submissions", r.status === 200);

const events = client();
await events.call("/api/admin/session", { method: "POST", json: { email: "eve@example.com", password: PW } });
const eventBody = (over = {}) => ({
  slug: "build-night",
  title: "Build night",
  description: "Bring a laptop.",
  starts_at: iso(10),
  ends_at: iso(10.1),
  location: "Block A, Room 101",
  registration_url: "https://example.com/register",
  image_url: null,
  status: "upcoming",
  published: true,
  ...over,
});
r = await events.call("/api/admin/cms/events", { method: "POST", json: eventBody() });
ok("events role can create an event", r.status === 200, JSON.stringify(r.body));
const eventId = r.body?.row?.id;
r = await events.call("/api/admin/cms/projects", { method: "POST", json: { name: "x" } });
ok("events role cannot touch projects (403)", r.status === 403);
r = await events.call("/api/admin/submissions");
ok("events role cannot read submissions (403)", r.status === 403);

const editor = client();
await editor.call("/api/admin/session", { method: "POST", json: { email: "ed@example.com", password: PW } });
r = await editor.call("/api/admin/users");
ok("editor cannot manage admins (403)", r.status === 403);

// Deactivating or signing someone out ends their sessions at once.
r = await owner.call(`/api/admin/users/${reviewerId}`, { method: "PUT", json: { sign_out: true } });
ok("owner signs reviewer out everywhere", r.status === 200);
r = await reviewer.call("/api/admin/submissions");
ok("old reviewer session no longer works", r.status === 401 || r.status === 403, r.status);
r = await reviewer.call("/api/admin/session", { method: "POST", json: { email: "rhea@example.com", password: PW } });
ok("reviewer can sign in again", r.status === 200);
r = await owner.call(`/api/admin/users/${reviewerId}`, { method: "PUT", json: { active: false } });
ok("owner deactivates reviewer", r.status === 200);
r = await reviewer.call("/api/admin/submissions");
ok("deactivated session refused", r.status === 401 || r.status === 403);
r = await reviewer.call("/api/admin/session", { method: "POST", json: { email: "rhea@example.com", password: PW } });
ok("deactivated account cannot sign in", r.status === 401);

// Changing your own password.
r = await editor.call("/api/admin/account", { method: "PUT", json: { current: "not-it-at-all-1!", next: "An0ther-strong-one" } });
ok("password change needs the current password", r.status >= 400 && r.status < 500);
r = await editor.call("/api/admin/account", { method: "PUT", json: { current: PW, next: "An0ther-strong-one" } });
ok("editor changes own password", r.status === 200, JSON.stringify(r.body));
r = await editor.call("/api/admin/cms/status");
ok("editor stays signed in after changing it", r.status === 200);
const editor2 = client();
r = await editor2.call("/api/admin/session", { method: "POST", json: { email: "ed@example.com", password: PW } });
ok("old password no longer works", r.status === 401);
r = await owner.call(`/api/admin/users/${editorId}`, { method: "DELETE" });
ok("owner removes an admin", r.status === 200);

// ---------------------------------------------------------------- history / undo
r = await owner.call(`/api/admin/cms/events/${eventId}`, { method: "PUT", json: eventBody({ title: "Build night (moved)" }) });
ok("event edited", r.status === 200 && r.body?.row?.title === "Build night (moved)");
r = await owner.call(`/api/admin/cms/versions?resource=events&id=${eventId}`);
ok("history lists the version before the edit", r.status === 200 && r.body.ready && r.body.versions.length >= 1 && r.body.versions[0].label === "Build night");
const versionId = r.body?.versions?.[0]?.id;
r = await events.call("/api/admin/cms/versions", { method: "POST", json: { resource: "events", version_id: versionId } });
ok("restore puts the old title back", r.status === 200 && r.body?.row?.title === "Build night", JSON.stringify(r.body));
r = await events.call("/api/admin/cms/versions", { method: "POST", json: { resource: "projects", version_id: versionId } });
ok("a version cannot be restored under another collection", r.status === 403 || r.status === 404);
r = await owner.call(`/api/admin/cms/events/${eventId}`, { method: "DELETE" });
ok("event deleted", r.status === 200);
r = await owner.call("/api/admin/cms/versions?resource=events&deleted=1");
const gone = r.body?.versions?.find((v) => v.entity_id === eventId);
ok("deleted event listed under Recently deleted", r.status === 200 && Boolean(gone));
r = await owner.call("/api/admin/cms/versions", { method: "POST", json: { resource: "events", version_id: gone?.id } });
ok("deleted event restored with the same id", r.status === 200 && r.body?.row?.id === eventId, JSON.stringify(r.body));
r = await owner.call("/api/admin/cms/versions?resource=events&deleted=1");
ok("restored event leaves Recently deleted", !r.body?.versions?.some((v) => v.entity_id === eventId));
r = await owner.call("/api/admin/cms/settings");
const settings = r.body?.row;
r = await owner.call("/api/admin/cms/settings", { method: "PUT", json: { ...settings, tagline: "A changed tagline" } });
ok("settings saved", r.status === 200, JSON.stringify(r.body));
r = await owner.call("/api/admin/cms/versions?resource=settings");
ok("settings history kept", r.status === 200 && r.body.versions.length >= 1);
r = await owner.call("/api/admin/cms/versions?resource=nope&id=1");
ok("unknown resource refused", r.status === 404 || r.status === 400);

// ---------------------------------------------------------------- galleries + calendar + JSON-LD
const media = `${M}/storage/v1/object/public/cms-media/cover`;
r = await owner.call(`/api/admin/cms/events/${eventId}`, { method: "PUT", json: eventBody({ gallery: ["https://evil.example/x.png"] }) });
ok("gallery refuses outside images", r.status === 422 && r.body?.errors?.gallery);
r = await owner.call(`/api/admin/cms/events/${eventId}`, { method: "PUT", json: eventBody({ gallery: [`${media}/a.png`, `${media}/b.png`] }) });
ok("gallery saved", r.status === 200 && r.body?.row?.gallery?.length === 2, JSON.stringify(r.body));
r = await owner.call("/api/calendar/build-night");
ok("ICS download", r.status === 200 && r.headers.get("content-type")?.startsWith("text/calendar") && /BEGIN:VEVENT[\s\S]*SUMMARY:Build night/.test(r.body));
ok("ICS escapes commas", String(r.body).includes("LOCATION:Block A\\, Room 101"));
r = await owner.call("/api/calendar/no-such-event");
ok("ICS for unknown event → 404", r.status === 404);
r = await owner.call("/api/calendar/..%2F..%2Fetc");
ok("ICS rejects odd slugs", r.status === 404);
r = await owner.call("/events");
ok("events page lists the event", r.status === 200 && r.body.includes("Build night"));
ok("events page has Event JSON-LD", /application\/ld\+json[^>]*>[^<]*"@type":"Event"[^<]*Build night/.test(r.body));
ok("Google Calendar link", r.body.includes("calendar.google.com/calendar/render"));
ok("gallery photos shown", r.body.includes("Photos from Build night"));

// ---------------------------------------------------------------- draft preview
r = await owner.call("/api/admin/cms/events", { method: "POST", json: eventBody({ slug: "secret-draft", title: "Secret draft event", published: false }) });
ok("draft event created", r.status === 200);
const anon = client();
r = await anon.call("/events");
ok("draft hidden from visitors", !r.body.includes("Secret draft event"));
r = await anon.call("/api/admin/preview?path=/events");
ok("preview needs an admin session", r.status === 401 || r.status === 403 || (r.status >= 300 && r.status < 400 && !anon.jar.has("__prerender_bypass")));
r = await owner.call("/api/admin/preview?path=/events");
ok("preview sets the draft cookie and redirects", r.status === 307 && owner.jar.has("__prerender_bypass") && r.headers.get("location")?.endsWith("/events"));
r = await owner.call("/events");
ok("admin in preview sees the draft", r.body.includes("Secret draft event"));
ok("preview banner shown", r.body.includes("Exit preview"));
const stolen = client();
stolen.jar.set("__prerender_bypass", owner.jar.get("__prerender_bypass"));
r = await stolen.call("/events");
ok("draft cookie alone (no admin session) shows nothing extra", !r.body.includes("Secret draft event"));
r = await owner.call("/api/admin/preview?path=//evil.example/x");
ok("preview never redirects off-site", r.status === 307 && new URL(r.headers.get("location")).host === new URL(A).host);
r = await owner.call("/api/preview-exit?path=/events");
ok("exit preview", r.status === 307 && !owner.jar.has("__prerender_bypass"));
r = await owner.call("/events");
ok("draft hidden again after exit", !r.body.includes("Secret draft event"));

// ---------------------------------------------------------------- bulk submissions
const ids = [];
for (let i = 0; i < 3; i++) {
  r = await anon.call("/api/submit", {
    method: "POST",
    json: { kind: "join", payload: { name: `Bulk ${i}`, email: `bulk${i}@example.com`, course: "B.Tech", year: "2", interests: ["Web"], why: "To build things with people." } },
  });
}
r = await owner.call("/api/admin/submissions?q=Bulk&per=25");
for (const row of r.body?.rows ?? []) ids.push(row.id);
ok("three submissions stored", ids.length === 3, JSON.stringify(r.body).slice(0, 200));
r = await owner.call("/api/admin/submissions/bulk", { method: "POST", json: { ids, action: "state", state: "reviewing" } });
ok("bulk status change", r.status === 200 && r.body?.count === 3);
r = await owner.call("/api/admin/submissions?q=Bulk&state=reviewing");
ok("all three now under review", r.body?.total === 3);
r = await owner.call("/api/admin/submissions/bulk", { method: "POST", json: { ids: ["not-a-uuid"], action: "delete" } });
ok("bulk refuses bad ids", r.status === 400);
r = await owner.call("/api/admin/submissions/bulk", { method: "POST", json: { ids, action: "state", state: "bogus" } });
ok("bulk refuses unknown states", r.status === 400);
r = await events.call("/api/admin/submissions/bulk", { method: "POST", json: { ids, action: "delete" } });
ok("events role cannot bulk delete (403)", r.status === 403);
r = await owner.call("/api/admin/submissions/bulk", { method: "POST", json: { ids: ids.slice(0, 2), action: "delete" }, headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" } });
ok("cross-site bulk delete blocked", r.status === 403);
r = await owner.call("/api/admin/submissions/bulk", { method: "POST", json: { ids: ids.slice(0, 2), action: "delete" } });
ok("bulk delete", r.status === 200 && r.body?.count === 2);
r = await owner.call("/api/admin/submissions?q=Bulk");
ok("one left", r.body?.total === 1);

// ---------------------------------------------------------------- email templates
r = await owner.call("/api/admin/cms/email-templates");
ok("email templates readable", r.status === 200 && r.body?.templates?.accepted?.subject);
r = await owner.call("/api/admin/cms/email-templates", { method: "PUT", json: { key: "accepted", subject: "You're in, {name}", body: "Welcome to {site}." } });
ok("email template saved", r.status === 200, JSON.stringify(r.body));
r = await owner.call("/api/admin/cms/email-templates", { method: "PUT", json: { key: "hacked", subject: "x", body: "y" } });
ok("unknown template key refused", r.status >= 400 && r.status < 500);

// ---------------------------------------------------------------- GitHub import + cron
r = await owner.call("/api/admin/github-import");
ok("import reports not configured", r.status === 200 && r.body?.repos?.length === 0);
r = await owner.call("/api/admin/github-import", { method: "POST" });
ok("import without repos does nothing", r.status === 200 && r.body?.ok === false && r.body?.reason === "not_configured");
r = await anon.call("/api/cron/github-activity");
ok("cron without secret → 401", r.status === 401);
r = await anon.call("/api/cron/github-activity", { headers: { authorization: "Bearer wrong" } });
ok("cron with wrong secret → 401", r.status === 401);
r = await anon.call("/api/cron/github-activity", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
ok("cron with the secret runs", r.status === 200 && r.body?.reason === "not_configured");

// ---------------------------------------------------------------- backup
r = await owner.call("/api/admin/backup");
ok("owner downloads a backup", r.status === 200 && r.body?.format === "acm-buildhub-backup" && Array.isArray(r.body?.tables?.submissions));
ok("backup has content tables", Array.isArray(r.body?.tables?.events) && Array.isArray(r.body?.tables?.site_settings));
ok("backup never contains password hashes", !JSON.stringify(r.body).includes("password_hash") && !JSON.stringify(r.body).includes("scrypt"));
ok("backup served as an attachment", /attachment/.test(r.headers.get("content-disposition") ?? ""));
r = await anon.call("/api/admin/backup");
ok("backup needs a session", r.status === 401);

// ---------------------------------------------------------------- email test
r = await owner.call("/api/admin/email-test", { method: "POST" });
ok("email test explains a missing API key", r.status === 200 && r.body?.ok === false && /RESEND_API_KEY/.test(r.body?.error ?? ""));
r = await events.call("/api/admin/email-test", { method: "POST" });
ok("email test needs settings permission", r.status === 403);
r = await anon.call("/api/admin/email-test", { method: "POST" });
ok("email test needs a session", r.status === 401 || r.status === 403);

// ---------------------------------------------------------------- audit trail
r = await owner.call("/api/admin/audit?per=100");
const summaries = (r.body?.rows ?? []).map((x) => x.summary ?? "").join("\n");
ok("audit records restores", /Restored/.test(summaries));
ok("audit records bulk actions", /Marked 3 submissions as Under review/.test(summaries) && /Deleted 2 submissions at once/.test(summaries));
ok("audit records backups", /Downloaded a full backup/.test(summaries));
ok("audit records account changes", /Added admin Rhea Reviewer/.test(summaries));

console.log(`\n${passes} passed, ${failures} failed`);
export const failed = failures;
