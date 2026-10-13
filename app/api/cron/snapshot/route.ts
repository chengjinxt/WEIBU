import { snapshotTopMarkets } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** 5 分钟级价格快照（GitHub Actions 每 5 分钟触发）。 */
export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const r = await snapshotTopMarkets(200);
    return Response.json({ ok: true, ...r });
  } catch (e) {
    console.error("snapshot failed:", e);
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
