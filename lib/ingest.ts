// 采集入库：Polymarket / Kalshi → Postgres（经 Prisma）
import { prisma } from "./db";
import { fetchTopEvents as fetchPolyEvents } from "./polymarket";
import { fetchKalshiEvents, midProb } from "./kalshi";

async function ensurePlatform(code: string, name: string, baseUrl: string) {
  return prisma.platform.upsert({
    where: { code },
    update: { name, baseUrl },
    create: { code, name, baseUrl },
  });
}

function toDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 同步 Polymarket 热门事件+市场 */
export async function syncPolymarket(limit = 100) {
  const platform = await ensurePlatform("polymarket", "Polymarket", "https://polymarket.com");
  const events = await fetchPolyEvents(limit);
  let eventCount = 0;
  let marketCount = 0;
  for (const e of events) {
    const rec = await prisma.event.upsert({
      where: { platformId_externalId: { platformId: platform.id, externalId: e.externalId } },
      update: {
        title: e.title,
        description: e.description,
        volume: e.volume,
        volume24h: e.volume24h,
        liquidity: e.liquidity,
        status: e.status,
        endTime: toDate(e.endTime),
      },
      create: {
        platformId: platform.id,
        externalId: e.externalId,
        slug: e.slug || e.externalId,
        title: e.title,
        description: e.description,
        tags: [],
        status: e.status,
        volume: e.volume,
        volume24h: e.volume24h,
        liquidity: e.liquidity,
        startTime: toDate(e.startTime),
        endTime: toDate(e.endTime),
        sourceUrl: e.slug ? `https://polymarket.com/event/${e.slug}` : null,
      },
    });
    eventCount++;
    for (const m of e.markets) {
      await prisma.market.upsert({
        where: { platformId_externalId: { platformId: platform.id, externalId: m.externalId } },
        update: {
          eventId: rec.id,
          question: m.question,
          outcomes: m.outcomes,
          outcomePrices: m.prices,
          volume: m.volume,
          volume24h: m.volume24h,
          liquidity: m.liquidity,
          status: m.status,
        },
        create: {
          eventId: rec.id,
          platformId: platform.id,
          externalId: m.externalId,
          question: m.question,
          outcomes: m.outcomes,
          outcomePrices: m.prices,
          volume: m.volume,
          volume24h: m.volume24h,
          liquidity: m.liquidity,
          status: m.status,
        },
      });
      marketCount++;
    }
  }
  return { eventCount, marketCount };
}

/** 同步 Kalshi open 事件+市场（cents 价转 0~1 概率） */
export async function syncKalshi(limit = 100) {
  const platform = await ensurePlatform("kalshi", "Kalshi", "https://kalshi.com");
  const { events } = await fetchKalshiEvents(limit);
  let eventCount = 0;
  let marketCount = 0;
  for (const e of events) {
    const rec = await prisma.event.upsert({
      where: { platformId_externalId: { platformId: platform.id, externalId: e.eventTicker } },
      update: { title: e.title, status: "open" },
      create: {
        platformId: platform.id,
        externalId: e.eventTicker,
        slug: e.eventTicker,
        title: e.title,
        tags: [],
        status: "open",
        sourceUrl: `https://kalshi.com/markets/${encodeURIComponent(e.eventTicker)}`,
      },
    });
    eventCount++;
    for (const m of e.markets) {
      const p = midProb(m);
      const prices = p === null ? [] : [p, 1 - p];
      await prisma.market.upsert({
        where: { platformId_externalId: { platformId: platform.id, externalId: m.ticker } },
        update: {
          eventId: rec.id,
          question: m.title,
          outcomes: ["Yes", "No"],
          outcomePrices: prices,
          volume: m.volume,
          liquidity: m.openInterest,
          status: m.status,
        },
        create: {
          eventId: rec.id,
          platformId: platform.id,
          externalId: m.ticker,
          question: m.title,
          outcomes: ["Yes", "No"],
          outcomePrices: prices,
          volume: m.volume,
          liquidity: m.openInterest,
          status: m.status,
        },
      });
      marketCount++;
    }
  }
  return { eventCount, marketCount };
}

/** 给 volume24h Top N 的 open 市场写价格快照 */
export async function snapshotTopMarkets(limit = 200) {
  const markets = await prisma.market.findMany({
    where: { status: "open" },
    orderBy: { volume24h: "desc" },
    take: limit,
    select: { id: true, outcomePrices: true, volume: true },
  });
  const now = new Date();
  if (markets.length === 0) return { count: 0 };
  await prisma.priceSnapshot.createMany({
    data: markets.map((m) => ({
      marketId: m.id,
      ts: now,
      prices: (m.outcomePrices as unknown[]) ?? [],
      volume: m.volume ?? 0,
    })),
  });
  return { count: markets.length };
}
