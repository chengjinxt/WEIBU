import EventCard from "../../components/EventCard";
import { searchEvents } from "../../lib/data";

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const kw = (q ?? "").trim();
  const results = kw ? await searchEvents(kw) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">搜索</h1>
        <form action="/search" method="get" className="mt-3 flex max-w-xl gap-2">
          <input
            name="q"
            defaultValue={kw}
            placeholder="输入事件标题或问题关键词…"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          >
            搜索
          </button>
        </form>
      </div>

      {kw === "" ? (
        <p className="text-sm text-zinc-400">在上方输入关键词，搜索已同步的事件与市场问题。</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-zinc-400">没有找到与“{kw}”相关的事件。</p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            找到 {results.length} 个与“{kw}”相关的事件
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((e) => (
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
        </>
      )}
    </div>
  );
}
