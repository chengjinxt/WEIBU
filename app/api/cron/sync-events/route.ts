import { syncPolymarket, syncKalshi } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** 每日全量事件同步（Vercel Cron）。GitHub Actions 不调这个。 */
export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const poly = await syncPolymarket(200);
    const kalshi = await syncKalshi(100);
    return Response.json({ ok: true, polymarket: poly, kalshi });
  } catch (e) {
    console.error("sync-events failed:", e);
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
