// Polymarket Gamma API 客户端（只读公开接口，无需认证）
// https://gamma-api.polymarket.com

const GAMMA_BASE = "https://gamma-api.polymarket.com";

export interface ParsedMarket {
  externalId: string;
  question: string;
  outcomes: string[];
  prices: number[]; // 0~1
  volume: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number | null; // 分数，如 0.05 = +5%
  status: string;
}

export interface Tag {
  label: string;
  slug: string;
}

export interface ParsedEvent {
  externalId: string;
  slug: string;
  title: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  volume: number;
  volume24h: number;
  liquidity: number;
  status: string;
  tags: Tag[];
  markets: ParsedMarket[];
}

// ---- 防御性取值 ----
function num(v: unknown, d = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
  }
  return d;
}
function str(v: unknown, d = ""): string {
  return typeof v === "string" ? v : d;
}
function asArr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p: unknown = JSON.parse(v);
      if (Array.isArray(p)) return p;
    } catch {
      /* 非 JSON 字符串，按空数组处理 */
    }
  }
  return [];
}
function strArr(v: unknown): string[] {
  return asArr(v).filter((x): x is string => typeof x === "string");
}
function numArr(v: unknown): number[] {
  return asArr(v)
    .map((x) => num(x, NaN))
    .filter((n) => Number.isFinite(n));
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseMarket(raw: any): ParsedMarket | null {
  if (!raw || typeof raw !== "object") return null;
  const externalId = str(raw.id) || str(raw.conditionId);
  const question = str(raw.question);
  if (!externalId || !question) return null;
  return {
    externalId,
    question,
    outcomes: strArr(raw.outcomes),
    prices: numArr(raw.outcomePrices),
    volume: num(raw.volume ?? raw.volumeNum),
    volume24h: num(raw.volume24hr ?? raw.volume24hrNum),
    liquidity: num(raw.liquidity ?? raw.liquidityNum),
    priceChange24h: numOrNull(raw.oneDayPriceChange),
    status: raw.closed === true ? "closed" : "open",
  };
}

export function parseEvent(raw: any): ParsedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const externalId = str(raw.id);
  const title = str(raw.title);
  if (!externalId || !title) return null;
  const markets = Array.isArray(raw.markets)
    ? raw.markets.map(parseMarket).filter((m: ParsedMarket | null): m is ParsedMarket => m !== null)
    : [];
  const tags: Tag[] = Array.isArray(raw.tags)
    ? raw.tags
        .map((t: any) => ({ label: str(t?.label), slug: str(t?.slug) }))
        .filter((t: Tag) => t.label)
    : [];
  return {
    externalId,
    slug: str(raw.slug),
    title,
    description: str(raw.description),
    startTime: str(raw.startDate) || null,
    endTime: str(raw.endDate) || null,
    volume: num(raw.volume ?? raw.volumeNum),
    volume24h: num(raw.volume24hr ?? raw.volume24hrNum),
    liquidity: num(raw.liquidity ?? raw.liquidityNum),
    status: raw.closed === true ? "closed" : "open",
    tags,
    markets,
  };
}

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": "weibu/0.1" } });
  if (!res.ok) throw new Error(`Gamma API ${res.status}: ${url}`);
  return res.json();
}

/** 按 24h 交易量取热门事件（含 markets） */
export async function fetchTopEvents(limit = 100): Promise<ParsedEvent[]> {
  const url = `${GAMMA_BASE}/events?active=true&closed=false&order=volume&ascending=false&limit=${limit}`;
  const raw = await getJSON(url);
  if (!Array.isArray(raw)) return [];
  return raw.map(parseEvent).filter((e): e is ParsedEvent => e !== null);
}

/** 按 id 取单个事件 */
export async function fetchEventById(id: string): Promise<ParsedEvent | null> {
  const raw = await getJSON(`${GAMMA_BASE}/events/${encodeURIComponent(id)}`);
  return parseEvent(raw);
}
