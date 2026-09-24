// In-memory stand-in for Supabase PostgREST + Storage, used by the test suite.
// Env: MOCK_PORT, MOCK_KEY, MOCK_NO_CMS=1 (start before cms.sql), MOCK_NO_ADMIN=1, MOCK_NO_V3=1.
import http from "node:http";
import { randomUUID } from "node:crypto";

const KEY = process.env.MOCK_KEY || "service-key";
const PORT = Number(process.env.MOCK_PORT || 5100);
const CMS = ["site_settings","nav_items","social_links","page_sections","roles","team_members","events","projects","project_members","announcements"];
const ADMIN = ["admin_audit","content_seeds","problems","ideas","research_projects","working_teams","activity_items"];
const V3 = ["admin_users","content_versions","email_templates"];
const v3Ready = process.env.MOCK_NO_V3 !== "1";
const db = { submissions: [] };
let cmsReady = process.env.MOCK_NO_CMS !== "1";
if (cmsReady) for (const t of CMS) db[t] = [];
if (process.env.MOCK_NO_ADMIN !== "1" && cmsReady) for (const t of ADMIN) db[t] = [];
if (v3Ready) for (const t of V3) db[t] = [];
let versionSeq = 1;
let auditSeq = 1;
const files = new Map(); // path -> {buf, type, created_at}
const log = [];

const PK = { page_sections: "key", site_settings: "id", content_seeds: "entity", email_templates: "key" };
/** Columns only there once v3.sql has run. */
const V3_COLUMNS = { events: ["gallery"], activity_items: ["source_ref"] };
const UNIQUE = { admin_users: ["email"], events: ["slug"], projects: ["slug"], roles: ["name"], problems: ["slug"], ideas: ["slug"], research_projects: ["slug"], working_teams: ["slug"] };
const DEFAULTS = {
  submissions: () => ({ id: randomUUID(), created_at: new Date().toISOString(), state: "new", note: null, anonymous: false, ...(process.env.MOCK_NO_ADMIN === "1" ? {} : { updated_at: null }) }),
  admin_audit: () => ({ id: auditSeq++, at: new Date().toISOString() }),
  content_versions: () => ({ id: versionSeq++, at: new Date().toISOString() }),
  admin_users: () => ({ active: true, session_version: 1, created_at: new Date().toISOString(), last_login_at: null }),
};

function parseFilters(u) {
  const out = [];
  for (const [k, v] of u.searchParams) {
    if (["select", "order", "limit", "on_conflict", "offset"].includes(k)) continue;
    out.push([k, v]);
  }
  return out;
}
/** "payload->>name" / "payload->interests" / "state" */
function col(row, expr) {
  const m = expr.match(/^(\w+)(?:->>?(\w+))?$/);
  if (!m) throw new Error("bad column " + expr);
  let v = row[m[1]];
  if (m[2] !== undefined) v = v == null ? undefined : v[m[2]];
  return v;
}
const unq = (v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);
function test(val, op, raw) {
  const v = unq(raw);
  switch (op) {
    case "eq": return val !== undefined && val !== null && String(val) === v;
    case "neq": return String(val) !== v;
    case "gt": return val != null && String(val) > v;
    case "gte": return val != null && String(val) >= v;
    case "lt": return val != null && String(val) < v;
    case "lte": return val != null && String(val) <= v;
    case "is": return v === "null" ? val == null : String(val) === v;
    case "in": return val != null && splitTop(v.slice(1, -1)).map(unq).includes(String(val));
    case "ilike": {
      const re = new RegExp("^" + v.split("*").map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$", "i");
      return val != null && re.test(String(val));
    }
    case "cs": { const want = JSON.parse(v); return Array.isArray(val) && want.every((w) => val.includes(w)); }
    default: throw new Error("unsupported op " + op);
  }
}
/** "a.op.v,b.op.v" inside or=()/and=() — split on top-level commas. */
function splitTop(s) {
  const parts = []; let depth = 0, q = false, cur = "";
  for (const ch of s) {
    if (ch === '"') q = !q;
    if (!q && ch === "(") depth++;
    if (!q && ch === ")") depth--;
    if (!q && depth === 0 && ch === ",") { parts.push(cur); cur = ""; } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts;
}
function cond(row, expr) {
  const lg = expr.match(/^(or|and)\((.*)\)$/);
  if (lg) { const subs = splitTop(lg[2]); return lg[1] === "or" ? subs.some((x) => cond(row, x)) : subs.every((x) => cond(row, x)); }
  const m = expr.match(/^([\w>-]+?)\.(not\.)?(\w+)\.(.*)$/s);
  if (!m) throw new Error("bad cond " + expr);
  const r = test(col(row, m[1]), m[3], m[4]);
  return m[2] ? !r : r;
}
function match(row, filters) {
  return filters.every(([k, v]) => {
    if (k === "or" || k === "and") return cond(row, `${k}${v}`);
    const neg = v.startsWith("not.");
    const body = neg ? v.slice(4) : v;
    const dot = body.indexOf(".");
    const r = test(col(row, k), body.slice(0, dot), body.slice(dot + 1));
    return neg ? !r : r;
  });
}
function order(rows, spec) {
  if (!spec) return rows;
  const parts = spec.split(",").map((p) => { const i = p.lastIndexOf("."); return [p.slice(0, i), p.slice(i + 1)]; });
  return [...rows].sort((a, b) => {
    for (const [key, dir] of parts) {
      const x = col(a, key), y = col(b, key);
      if (x === y) continue;
      const c = x == null ? 1 : y == null ? -1 : x < y ? -1 : 1;
      return dir === "desc" ? -c : c;
    }
    return 0;
  });
}
function project(rows, select) {
  if (!select || select === "*") return rows;
  const cols = select.split(",").map((c) => {
    const [alias, expr] = c.includes(":") ? c.split(":") : [c.replace(/^.*->>?/, ""), c];
    return [alias, expr];
  });
  return rows.map((r) => Object.fromEntries(cols.map(([alias, expr]) => [alias, col(r, expr) ?? null])));
}

http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const raw = Buffer.concat(chunks);
    const u = new URL(req.url, "http://x");
    const send = (code, obj, type = "application/json") => {
      res.writeHead(code, { "Content-Type": type });
      res.end(obj === undefined ? "" : type === "application/json" ? JSON.stringify(obj) : obj);
    };

    // Control endpoints for tests.
    if (u.pathname === "/__mock/state") return send(200, { db, files: [...files.keys()], log: log.slice(-50) });
    if (u.pathname === "/__mock/create-cms") { for (const t of CMS) db[t] ??= []; cmsReady = true; return send(200, { ok: true }); }
    if (u.pathname === "/__mock/create-admin") { for (const t of ADMIN) db[t] ??= []; return send(200, { ok: true }); }
    if (u.pathname === "/__mock/touch-submission") {
      // Simulates another admin changing a row directly.
      const r = db.submissions.find((x) => x.id === u.searchParams.get("id"));
      if (r) { r.state = u.searchParams.get("state") || r.state; r.updated_at = new Date().toISOString(); }
      return send(200, r ?? {});
    }

    // Public storage reads need no key.
    const pub = u.pathname.match(/^\/storage\/v1\/object\/public\/cms-media\/(.+)$/);
    if (pub && req.method === "GET") {
      const f = files.get(decodeURIComponent(pub[1]));
      if (!f) return send(404, { message: "not found" });
      res.writeHead(200, { "Content-Type": f.type }); return res.end(f.buf);
    }

    const auth = req.headers.authorization === `Bearer ${KEY}` && req.headers.apikey === KEY;
    if (!auth) return send(401, { message: "bad key" });

    if (u.pathname.startsWith("/storage/v1/")) {
      const listM = u.pathname === "/storage/v1/object/list/cms-media";
      if (listM && req.method === "POST") {
        const { prefix } = JSON.parse(raw.toString());
        const out = [...files.entries()].filter(([p]) => p.startsWith(prefix + "/"))
          .map(([p, f]) => ({ name: p.slice(prefix.length + 1), created_at: f.created_at, metadata: { size: f.buf.length } }));
        return send(200, out);
      }
      const up = u.pathname.match(/^\/storage\/v1\/object\/cms-media\/(.+)$/);
      if (up && req.method === "POST") {
        files.set(decodeURIComponent(up[1]), { buf: raw, type: req.headers["content-type"], created_at: new Date().toISOString() });
        log.push(`UPLOAD ${up[1]} ${raw.length}`);
        return send(200, { Key: `cms-media/${up[1]}` });
      }
      if (u.pathname === "/storage/v1/object/cms-media" && req.method === "DELETE") {
        const { prefixes } = JSON.parse(raw.toString());
        prefixes.forEach((p) => files.delete(p));
        log.push(`DELETE-FILE ${prefixes}`);
        return send(200, []);
      }
      return send(404, { message: "no storage route" });
    }

    const m = u.pathname.match(/^\/rest\/v1\/(\w+)$/);
    if (!m) return send(404, { message: "no" });
    const table = m[1];
    if (!db[table]) return send(404, { code: "PGRST205", message: `Could not find the table 'public.${table}'` });
    const rows = db[table];
    const pk = PK[table] ?? "id";
    const prefer = req.headers.prefer || "";
    const wantRep = prefer.includes("return=representation");
    const filters = parseFilters(u);

    try {
      if (req.method === "GET") {
        if (table === "submissions" && (u.searchParams.get("select") || "").includes("updated_at") && process.env.MOCK_NO_ADMIN === "1") {
          return send(400, { code: "42703", message: "column submissions.updated_at does not exist" });
        }
        if (!v3Ready && (V3_COLUMNS[table] ?? []).some((c) => (u.searchParams.get("select") || "").split(",").includes(c) || u.searchParams.has(c))) {
          return send(400, { code: "42703", message: "column does not exist" });
        }
        const all = order(rows.filter((r) => match(r, filters)), u.searchParams.get("order"));
        const offset = Number(u.searchParams.get("offset") || 0);
        const limit = Number(u.searchParams.get("limit") || 0);
        const out = limit ? all.slice(offset, offset + limit) : all.slice(offset);
        if (prefer.includes("count=exact")) {
          res.setHeader("Content-Range", `${offset}-${offset + out.length - 1}/${all.length}`);
        }
        return send(200, project(out, u.searchParams.get("select")));
      }
      if (req.method === "POST") {
        const body = JSON.parse(raw.toString());
        const items = Array.isArray(body) ? body : [body];
        const merge = prefer.includes("resolution=merge-duplicates");
        const created = [];
        for (const item of items) {
          if (!v3Ready && (V3_COLUMNS[table] ?? []).some((c) => c in item)) return send(400, { code: "PGRST204", message: "column not found" });
          const row = { ...(pk === "id" && table !== "site_settings" ? { id: randomUUID() } : {}), ...(DEFAULTS[table]?.() ?? {}), ...(["submissions", "admin_audit", "content_seeds", "content_versions"].includes(table) ? {} : { updated_at: new Date().toISOString() }), ...item };
          const existing = rows.find((r) => r[pk] === row[pk]);
          if (existing) {
            if (!merge) return send(409, { code: "23505", message: "duplicate key" });
            Object.assign(existing, row); created.push(existing); continue;
          }
          for (const col of UNIQUE[table] ?? []) if (rows.some((r) => r[col] === row[col])) return send(409, { code: "23505", message: `duplicate ${col}` });
          if (table === "team_members" && !db.roles.some((r) => r.id === row.role_id)) return send(409, { code: "23503", message: "fk role" });
          rows.push(row); created.push(row);
        }
        log.push(`INSERT ${table} x${created.length}`);
        return wantRep ? send(201, project(created, u.searchParams.get("select"))) : send(201);
      }
      if (req.method === "PATCH") {
        const patch = JSON.parse(raw.toString());
        const hit = rows.filter((r) => match(r, filters));
        for (const r of hit) {
          for (const col of UNIQUE[table] ?? []) if (patch[col] !== undefined && rows.some((o) => o !== r && o[col] === patch[col])) return send(409, { code: "23505" });
          Object.assign(r, patch);
        }
        log.push(`UPDATE ${table} x${hit.length}`);
        return wantRep ? send(200, project(hit, u.searchParams.get("select"))) : send(204);
      }
      if (req.method === "DELETE") {
        const hit = rows.filter((r) => match(r, filters));
        if (table === "roles" && hit.some((role) => db.team_members.some((m) => m.role_id === role.id))) {
          return send(409, { code: "23503", message: "violates foreign key" });
        }
        db[table] = rows.filter((r) => !hit.includes(r));
        if (table === "projects") db.project_members = db.project_members.filter((pm) => !hit.some((p) => p.id === pm.project_id));
        if (table === "team_members") for (const pm of db.project_members) if (hit.some((h) => h.id === pm.member_id)) pm.member_id = null;
        log.push(`DELETE ${table} x${hit.length}`);
        return wantRep ? send(200, project(hit, u.searchParams.get("select"))) : send(204);
      }
      send(405, {});
    } catch (e) {
      send(400, { message: String(e) });
    }
  });
}).listen(PORT, () => console.log(`mock postgrest on ${PORT} (cms tables: ${cmsReady})`));
