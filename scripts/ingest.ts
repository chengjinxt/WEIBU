// CLI 入口：npm run ingest <fetch-test|sync|snapshot> [--limit=N]
import { prisma } from "../lib/db";
import { syncPolymarket, syncKalshi, snapshotTopMarkets } from "../lib/ingest";
import { fetchTopEvents } from "../lib/polymarket";
import { fetchKalshiEvents } from "../lib/kalshi";

function argLimit(def: number): number {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  const n = a ? Number(a.split("=")[1]) : def;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

async function main() {
  const cmd = process.argv[2];
  const limit = argLimit(100);

  if (cmd === "fetch-test") {
    // 不写库：只调真实 API 验证解析
    const pe = await fetchTopEvents(5);
    console.log(`polymarket: ${pe.length} events`);
    for (const e of pe.slice(0, 3)) {
      const m0 = e.markets[0];
      console.log(
        `  - ${e.title} | vol24h=${Math.round(e.volume24h)} | markets=${e.markets.length}` +
          (m0 ? ` | e.g. "${m0.question}" prices=[${m0.prices.join(",")}]` : ""),
      );
    }
    const { events: ke } = await fetchKalshiEvents(5);
    console.log(`kalshi: ${ke.length} events`);
    for (const e of ke.slice(0, 3)) {
      console.log(`  - ${e.title} | markets=${e.markets.length}`);
    }
    return;
  }

  if (cmd === "sync") {
    console.log("polymarket:", await syncPolymarket(limit));
    console.log("kalshi:", await syncKalshi(limit));
    return;
  }

  if (cmd === "snapshot") {
    console.log(await snapshotTopMarkets(limit));
    return;
  }

  console.log("usage: ingest.ts <fetch-test|sync|snapshot> [--limit=N]");
  process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error("ingest failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
