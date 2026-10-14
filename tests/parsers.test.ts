// 解析器单测：node:test + tsx（npm test）
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEvent, parseMarket } from "../lib/polymarket";
import { parseKalshiEvent, parseKalshiMarket, midProb } from "../lib/kalshi";

test("polymarket parseMarket：正常解析", () => {
  const m = parseMarket({
    id: "123",
    question: "Will it rain?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.65", "0.35"],
    volume: "1000",
    volume24hr: 100,
    liquidity: 500,
    closed: false,
  });
  assert.ok(m);
  assert.equal(m.externalId, "123");
  assert.deepEqual(m.outcomes, ["Yes", "No"]);
  assert.deepEqual(m.prices, [0.65, 0.35]);
  assert.equal(m.volume, 1000);
  assert.equal(m.status, "open");
});

test("polymarket parseMarket：outcomes/outcomePrices 为 JSON 字符串时能解析", () => {
  const m = parseMarket({
    id: "123",
    question: "Will it rain?",
    outcomes: '["Yes", "No"]',
    outcomePrices: '["0.1415", "0.8585"]',
  });
  assert.ok(m);
  assert.deepEqual(m.outcomes, ["Yes", "No"]);
  assert.deepEqual(m.prices, [0.1415, 0.8585]);
});

test("polymarket parseMarket：解析 oneDayPriceChange 与缺失时为 null", () => {
  const m1 = parseMarket({ id: "1", question: "Q?", oneDayPriceChange: -0.025 });
  assert.equal(m1?.priceChange24h, -0.025);
  const m2 = parseMarket({ id: "2", question: "Q?" });
  assert.equal(m2?.priceChange24h, null);
  const m3 = parseMarket({ id: "3", question: "Q?", oneDayPriceChange: "0.1" });
  assert.equal(m3?.priceChange24h, 0.1);
});

test("polymarket parseEvent：解析 tags 数组", () => {
  const e = parseEvent({
    id: "e1",
    title: "Some event",
    tags: [
      { id: "1", label: "Politics", slug: "politics" },
      { id: "2", label: "", slug: "empty" },
    ],
    markets: [],
  });
  assert.deepEqual(e?.tags, [{ label: "Politics", slug: "politics" }]);
});

test("polymarket parseMarket：缺失关键字段返回 null", () => {
  assert.equal(parseMarket(null), null);
  assert.equal(parseMarket({}), null);
  assert.equal(parseMarket({ id: "1" }), null); // 无 question
});

test("polymarket parseMarket：脏数据不崩溃", () => {
  const m = parseMarket({ id: "1", question: "q", outcomes: "not-array", outcomePrices: [null, "x"] });
  assert.ok(m);
  assert.deepEqual(m.outcomes, []);
  assert.deepEqual(m.prices, []);
});

test("polymarket parseEvent：解析 markets 数组", () => {
  const e = parseEvent({
    id: "9",
    slug: "test-event",
    title: "Test",
    markets: [{ id: "1", question: "q1" }, { nope: true }],
  });
  assert.ok(e);
  assert.equal(e.markets.length, 1);
  assert.equal(e.status, "open");
});

test("kalshi parseKalshiMarket：cents 解析", () => {
  const m = parseKalshiMarket({
    ticker: "KXTEST-26",
    title: "Test market",
    yes_bid: 64,
    yes_ask: 66,
    last_price: 60,
    volume: 1234,
    status: "open",
  });
  assert.ok(m);
  assert.equal(midProb(m), 0.65);
});

test("kalshi midProb：无买卖盘时退化用 lastPrice", () => {
  const m = parseKalshiMarket({ ticker: "KX-1", yes_bid: 0, yes_ask: 0, last_price: 40 });
  assert.ok(m);
  assert.equal(midProb(m), 0.4);
});

test("kalshi parseKalshiEvent：嵌套 markets", () => {
  const e = parseKalshiEvent({
    event_ticker: "KXEVT",
    title: "Evt",
    markets: [{ ticker: "KXEVT-1" }, null],
  });
  assert.ok(e);
  assert.equal(e.markets.length, 1);
});
