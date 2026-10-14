import Link from "next/link";
import EventCard from "../components/EventCard";
import ProbBar from "../components/ProbBar";
import { fmtUSD, fmtChange } from "../lib/format";
import { getHotEvents, getMovers, getCategories } from "../lib/data";

export const revalidate = 300; // 5 分钟增量再生

function SectionTitle({ children, more }: { children: React.ReactNode; more?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-xl font-bold">{children}</h2>
      {more && (
        <span className="text-sm text-zinc-400">{more}</span>
      )}
    </div>
  );
}

export default async function Home() {
  const [hot, movers, cats] = await Promise.all([
    getHotEvents(12),
    getMovers(10),
    getCategories(10),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">中文预测市场信息聚合</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          聚合 Polymarket、Kalshi 公开行情，只做信息展示。数据每 5 分钟更新。
        </p>
      </section>

      <section>
        <SectionTitle>热门事件</SectionTitle>
        {hot.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无数据，等待首次同步完成。</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hot.map((e) => (
              <EventCard
                key={e.id}
                slug={e.slug}
                title={e.title}
                platformName={e.platform.name}
                category={e.category}
                volume24h={e.volume24h}
                marketCount={e._count.markets}
                topMarket={e.markets[0] ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle more="按 24h 价格变动幅度排序">24h 异动榜</SectionTitle>
        {movers.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无异动数据。</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {movers.map((m, i) => {
              const chg = m.priceChange24h ?? 0;
              return (
                <Link
                  key={m.id}
                  href={`/event/${encodeURIComponent(m.event.slug)}`}
                  className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-zinc-300 dark:text-zinc-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.question}</p>
                    <p className="truncate text-xs text-zinc-400">{m.event.title}</p>
                  </div>
                  <div className="hidden w-48 shrink-0 sm:block">
                    <ProbBar outcomes={m.outcomes} prices={m.outcomePrices} />
                  </div>
                  <span
                    className={`w-20 shrink-0 text-right text-sm font-semibold tabular-nums ${
                      chg >= 0 ? "text-red-500" : "text-emerald-500"
                    }`}
                  >
                    {fmtChange(chg)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>分类浏览</SectionTitle>
        {cats.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无分类数据。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link
                key={c.name}
                href={`/category/${encodeURIComponent(c.name)}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {c.name}
                <span className="ml-1 text-xs text-zinc-400">{c.count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-zinc-400">
        热门事件按 24h 交易量 {hot.length > 0 && `（示例：${fmtUSD(hot[0].volume24h)}）`}排序，仅展示已同步的公开行情。
      </p>
    </div>
  );
}
