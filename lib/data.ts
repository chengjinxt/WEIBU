// 页面共用的数据查询
import { prisma } from "./db";

export async function getHotEvents(take = 12) {
  return prisma.event.findMany({
    where: { status: "open" },
    orderBy: { volume24h: "desc" },
    take,
    include: {
      platform: true,
      markets: { orderBy: { volume24h: "desc" }, take: 1 },
      _count: { select: { markets: true } },
    },
  });
}

/** 24h 异动：按 |priceChange24h| 取 Top N（目前仅 Polymarket 有该字段） */
export async function getMovers(take = 10) {
  const markets = await prisma.market.findMany({
    where: { status: "open", priceChange24h: { not: null } },
    orderBy: { volume24h: "desc" },
    take: 200,
    include: { event: { include: { platform: true } } },
  });
  return markets
    .sort((a, b) => Math.abs(b.priceChange24h ?? 0) - Math.abs(a.priceChange24h ?? 0))
    .slice(0, take);
}

/** 分类及各自事件数 */
export async function getCategories(take = 12) {
  const groups = await prisma.event.groupBy({
    by: ["category"],
    where: { status: "open", category: { not: null } },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
    take,
  });
  return groups.map((g) => ({ name: g.category as string, count: g._count.category }));
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findFirst({
    where: { slug: decodeURIComponent(slug) },
    orderBy: { volume24h: "desc" },
    include: {
      platform: true,
      markets: { orderBy: { volume24h: "desc" } },
    },
  });
}

export async function searchEvents(q: string, take = 30) {
  const kw = q.trim();
  if (!kw) return [];
  return prisma.event.findMany({
    where: {
      OR: [
        { title: { contains: kw, mode: "insensitive" } },
        { markets: { some: { question: { contains: kw, mode: "insensitive" } } } },
      ],
    },
    orderBy: { volume24h: "desc" },
    take,
    include: {
      platform: true,
      markets: { orderBy: { volume24h: "desc" }, take: 1 },
      _count: { select: { markets: true } },
    },
  });
}

export async function getEventsByCategory(category: string, take = 30) {
  return prisma.event.findMany({
    where: { status: "open", category },
    orderBy: { volume24h: "desc" },
    take,
    include: {
      platform: true,
      markets: { orderBy: { volume24h: "desc" }, take: 1 },
      _count: { select: { markets: true } },
    },
  });
}
