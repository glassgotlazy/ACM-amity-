import { audit } from "@/lib/audit";
import { BACKUP_TABLES } from "@/lib/backup-tables.mjs";
import { rest, StorageError } from "@/lib/supabase";
import { handle } from "../cms/_handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 1000;

async function dump(table: string, select: string): Promise<unknown[] | null> {
  const rows: unknown[] = [];
  try {
    for (let offset = 0; offset < 100_000; offset += PAGE) {
      const page = await rest<unknown[]>(`${table}?select=${select}&limit=${PAGE}&offset=${offset}`);
      rows.push(...page);
      if (page.length < PAGE) break;
    }
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) return null; // table not created yet
    throw error;
  }
  return rows;
}

/**
 * The whole database as one JSON file (owner only). Holds applicants'
 * personal details: store it somewhere private.
 */
export async function GET(request: Request) {
  return handle(request, "backup:read", async (session) => {
    const tables: Record<string, unknown[]> = {};
    for (const [table, select] of BACKUP_TABLES) {
      const rows = await dump(table, select);
      if (rows) tables[table] = rows;
    }
    await audit({ actor: session.actor, action: "export", entity: "backup", summary: "Downloaded a full backup" });
    const at = new Date().toISOString();
    return new Response(JSON.stringify({ format: "acm-buildhub-backup", version: 1, at, tables }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="acm-backup-${at.slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
