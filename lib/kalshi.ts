// Kalshi Trade API v2（公开行情无需认证）
// https://api.elections.kalshi.com/trade-api/v2

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export interface ParsedKalshiMarket {
  ticker: string;
  title: string;
  yesBid: number; // cents 0~100
  yesAsk: number; // cents 0~100
  lastPrice: number; // cents 0~100
  volume: number;
  openInterest: number;
  status: string;
  closeTime: string | null;
}

export interface ParsedKalshiEvent {
  eventTicker: string;
  title: string;
  markets: ParsedKalshiMarket[];
}

/** cents 价转 0~1 概率：买卖中间价优先，退化用 lastPrice */
export function midProb(m: ParsedKalshiMarket): number | null {
  if (m.yesBid > 0 && m.yesAsk > 0) return (m.yesBid + m.yesAsk) / 2 / 100;
  if (m.lastPrice > 0) return m.lastPrice / 100;
  return null;
}

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

export function parseKalshiMarket(raw: any): ParsedKalshiMarket | null {
  if (!raw || typeof raw !== "object") return null;
  const ticker = str(raw.ticker);
  if (!ticker) return null;
  return {
    ticker,
    title: str(raw.title),
    yesBid: num(raw.yes_bid),
    yesAsk: num(raw.yes_ask),
    lastPrice: num(raw.last_price),
    volume: num(raw.volume),
    openInterest: num(raw.open_interest),
    status: str(raw.status, "open"),
    closeTime: str(raw.close_time) || null,
  };
}

export function parseKalshiEvent(raw: any): ParsedKalshiEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const eventTicker = str(raw.event_ticker);
  if (!eventTicker) return null;
  const markets = Array.isArray(raw.markets)
    ? raw.markets.map(parseKalshiMarket).filter((m): m is ParsedKalshiMarket => m !== null)
    : [];
  return {
    eventTicker,
    title: str(raw.title, eventTicker),
    markets,
  };
}

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": "weibu/0.1" } });
  if (!res.ok) throw new Error(`Kalshi API ${res.status}: ${url}`);
  return res.json();
}

/** 取 open 事件（含嵌套 markets），按 cursor 翻页 */
export async function fetchKalshiEvents(
  limit = 100,
): Promise<{ events: ParsedKalshiEvent[]; cursor: string | null }> {
  const params = new URLSearchParams({
    status: "open",
    limit: String(Math.min(limit, 200)),
    with_nested_markets: "true",
  });
  const raw = await getJSON(`${KALSHI_BASE}/events?${params}`);
  const events = Array.isArray(raw?.events)
    ? raw.events.map(parseKalshiEvent).filter((e): e is ParsedKalshiEvent => e !== null)
    : [];
  return { events, cursor: typeof raw?.cursor === "string" && raw.cursor ? raw.cursor : null };
}
