// Weekly database backup, run by .github/workflows/backup.yml.
// Reads every table over PostgREST with the service-role key and writes one
// JSON file. The workflow encrypts it before it is stored anywhere.
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   required
//   BACKUP_FILE                               output path (default backup.json)
import { writeFile } from "node:fs/promises";
import { BACKUP_TABLES } from "../src/lib/backup-tables.mjs";

const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const PAGE = 1000;
const tables = {};
for (const [table, select] of BACKUP_TABLES) {
  const rows = [];
  let missing = false;
  for (let offset = 0; offset < 100_000; offset += PAGE) {
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=${PAGE}&offset=${offset}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.status === 404) {
      missing = true;
      break;
    }
    if (!res.ok) {
      console.error(`${table}: Supabase answered ${res.status}`);
      process.exit(1);
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  if (!missing) tables[table] = rows;
  console.log(`${table}: ${missing ? "not created yet" : `${rows.length} rows`}`);
}

const at = new Date().toISOString();
await writeFile(process.env.BACKUP_FILE ?? "backup.json", JSON.stringify({ format: "acm-buildhub-backup", version: 1, at, tables }));
console.log("Backup written.");
