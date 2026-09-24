import { handle } from "../cms/_handle";
import { listSubmissions, parseQuery } from "@/lib/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET ?kind&state&category&q&from&to&sort&page&per — one page of the queue,
 * filtered and sorted in the database, with the total for paging.
 */
export async function GET(request: Request) {
  return handle(request, "submissions:read", async () => {
    const query = parseQuery(new URL(request.url).searchParams);
    const { rows, total } = await listSubmissions(query);
    return { rows, total, page: query.page, per: query.per };
  });
}
