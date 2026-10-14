// 采集入库：Polymarket / Kalshi → Postgres（经 Prisma）
//
// 性能说明：Supabase 单次往返约 300~500ms，逐条 upsert 3000+ 次要 18 分钟，
// Vercel Hobby cron 60 秒超时根本跑不完。这里用原生 SQL 的
// INSERT ... ON CONFLICT DO UPDATE 做真批量：每 500 行一次往返。
import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { fetchTopEvents as fetchPolyEvents, type ParsedEvent } from "./polymarket";
import { fetchKalshiEvents, midProb, type ParsedKalshiEvent } from "./kalshi";

const CHUNK = 500;

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

/**
 * 真批量 upsert。rows 为已拼好的行 SQL（Prisma.sql`(...)`），返回冲突键到 id 的映射。
 * conflictCols 如 '"platformId", "externalId"'；updateCols 为冲突时更新的列。
 */
async function bulkUpsert(
  table: string,
  columns: string[],
  conflictCols: string,
  updateCols: string[],
  rows: Prisma.Sql[],
  returning: string | null = null,
): Promise<{ id: number; key: string }[]> {
  const out: { id: number; key: string }[] = [];
  if (rows.length === 0) return out;
  const updateSet = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const sql = Prisma.sql`
      INSERT INTO ${Prisma.raw(table)} (${Prisma.raw(columns.join(", "))})
      VALUES ${Prisma.join(chunk)}
      ON CONFLICT (${Prisma.raw(conflictCols)}) DO UPDATE SET ${Prisma.raw(updateSet)}
      ${returning ? Prisma.raw(`RETURNING ${returning}`) : Prisma.empty}
    `;
    if (returning) {
      const got = await prisma.$queryRaw<{ id: number; key: string }[]>(sql);
      out.push(...got);
    } else {
      await prisma.$executeRaw(sql);
    }
  }
  return out;
}

interface EventRow {
  externalId: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: unknown;
  status: string;
  volume: number;
  volume24h: number;
  liquidity: number;
  startTime: Date | null;
  endTime: Date | null;
  sourceUrl: string | null;
}

function eventRowSql(platformId: number, r: EventRow): Prisma.Sql {
  return Prisma.sql`(
    ${platformId}, ${r.externalId}, ${r.slug}, ${r.title}, ${r.description},
    ${r.category}, ${JSON.stringify(r.tags ?? [])}::jsonb, ${r.status},
    ${r.volume}, ${r.volume24h}, ${r.liquidity},
    ${r.startTime}, ${r.endTime}, ${r.sourceUrl}, NOW(), NOW()
  )`;
}

const EVENT_COLS = [
  '"platformId"', '"externalId"', '"slug"', '"title"', '"description"',
  '"category"', '"tags"', '"status"',
  '"volume"', '"volume24h"', '"liquidity"',
  '"startTime"', '"endTime"', '"sourceUrl"', '"createdAt"', '"updatedAt"',
];
const EVENT_UPDATE_COLS = [
  '"title"', '"description"', '"category"', '"tags"', '"status"',
  '"volume"', '"volume24h"', '"liquidity"', '"startTime"', '"endTime"',
  '"sourceUrl"', '"updatedAt"',
];

async function upsertEvents(
  platformId: number,
  rows: EventRow[],
): Promise<Map<string, number>> {
  const got = await bulkUpsert(
    '"Event"',
    EVENT_COLS,
    '"platformId", "externalId"',
    EVENT_UPDATE_COLS,
    rows.map((r) => eventRowSql(platformId, r)),
    '"id", "externalId" AS "key"',
  );
  return new Map(got.map((g) => [g.key, g.id]));
}

interface MarketRow {
  eventId: number;
  externalId: string;
  question: string;
  outcomes: unknown;
  prices: unknown;
  volume: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number | null;
  status: string;
}

const MARKET_COLS = [
  '"eventId"', '"platformId"', '"externalId"', '"question"',
  '"outcomes"', '"outcomePrices"',
  '"volume"', '"volume24h"', '"liquidity"', '"priceChange24h"',
  '"status"', '"updatedAt"',
];
const MARKET_UPDATE_COLS = [
  '"eventId"', '"question"', '"outcomes"', '"outcomePrices"',
  '"volume"', '"volume24h"', '"liquidity"', '"priceChange24h"',
  '"status"', '"updatedAt"',
];

async function upsertMarkets(platformId: number, rows: MarketRow[]): Promise<void> {
  const sqlRows = rows.map(
    (r) => Prisma.sql`(
      ${r.eventId}, ${platformId}, ${r.externalId}, ${r.question},
      ${JSON.stringify(r.outcomes ?? [])}::jsonb, ${JSON.stringify(r.prices ?? [])}::jsonb,
      ${r.volume}, ${r.volume24h}, ${r.liquidity}, ${r.priceChange24h},
      ${r.status}, NOW()
    )`,
  );
  await bulkUpsert('"Market"', MARKET_COLS, '"platformId", "externalId"', MARKET_UPDATE_COLS, sqlRows);
}

/** 同步 Polymarket 热门事件+市场 */
export async function syncPolymarket(limit = 100) {
  const platform = await ensurePlatform("polymarket", "Polymarket", "https://polymarket.com");
  const events: ParsedEvent[] = await fetchPolyEvents(limit);
  const idMap = await upsertEvents(
    platform.id,
    events.map((e) => ({
      externalId: e.externalId,
      slug: e.slug || e.externalId,
      title: e.title,
      description: e.description || null,
      category: e.tags[0]?.label ?? null,
      tags: e.tags,
      status: e.status,
      volume: e.volume,
      volume24h: e.volume24h,
      liquidity: e.liquidity,
      startTime: toDate(e.startTime),
      endTime: toDate(e.endTime),
      sourceUrl: e.slug ? `https://polymarket.com/event/${e.slug}` : null,
    })),
  );
  const marketRows: MarketRow[] = [];
  for (const e of events) {
    const eventId = idMap.get(e.externalId);
    if (!eventId) continue;
    for (const m of e.markets) {
      marketRows.push({
        eventId,
        externalId: m.externalId,
        question: m.question,
        outcomes: m.outcomes,
        prices: m.prices,
        volume: m.volume,
        volume24h: m.volume24h,
        liquidity: m.liquidity,
        priceChange24h: m.priceChange24h,
        status: m.status,
      });
    }
  }
  await upsertMarkets(platform.id, marketRows);
  return { eventCount: events.length, marketCount: marketRows.length };
}

/** 同步 Kalshi open 事件+市场（cents 价转 0~1 概率） */
export async function syncKalshi(limit = 100) {
  const platform = await ensurePlatform("kalshi", "Kalshi", "https://kalshi.com");
  const { events }: { events: ParsedKalshiEvent[] } = await fetchKalshiEvents(limit);
  const idMap = await upsertEvents(
    platform.id,
    events.map((e) => ({
      externalId: e.eventTicker,
      slug: e.eventTicker,
      title: e.title,
      description: null,
      category: null,
      tags: [],
      status: "open",
      volume: 0,
      volume24h: 0,
      liquidity: 0,
      startTime: null,
      endTime: null,
      sourceUrl: `https://kalshi.com/markets/${encodeURIComponent(e.eventTicker)}`,
    })),
  );
  const marketRows: MarketRow[] = [];
  for (const e of events) {
    const eventId = idMap.get(e.eventTicker);
    if (!eventId) continue;
    for (const m of e.markets) {
      const p = midProb(m);
      marketRows.push({
        eventId,
        externalId: m.ticker,
        question: m.title,
        outcomes: ["Yes", "No"],
        prices: p === null ? [] : [p, 1 - p],
        volume: m.volume,
        volume24h: 0,
        liquidity: m.openInterest,
        priceChange24h: null,
        status: m.status,
      });
    }
  }
  await upsertMarkets(platform.id, marketRows);
  return { eventCount: events.length, marketCount: marketRows.length };
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
      prices: (m.outcomePrices ?? []) as Prisma.InputJsonValue,
      volume: m.volume ?? 0,
    })),
  });
  return { count: markets.length };
}
