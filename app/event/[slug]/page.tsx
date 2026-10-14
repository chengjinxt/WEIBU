import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProbBar from "../../../components/ProbBar";
import { fmtUSD, fmtChange } from "../../../lib/format";
import { getEventBySlug } from "../../../lib/data";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  return { title: e ? `${e.title} - 未卜 WEIBU` : "事件不存在 - 未卜 WEIBU" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {e.platform.name}
          </span>
          {e.category && (
            <Link
              href={`/category/${encodeURIComponent(e.category)}`}
              className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 hover:underline dark:bg-sky-950 dark:text-sky-300"
            >
              {e.category}
            </Link>
          )}
          <span className="text-zinc-400">
            {e.status === "open" ? "进行中" : e.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-snug">{e.title}</h1>
        {e.description && (
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {e.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-zinc-400">24h 交易量</p>
            <p className="font-semibold tabular-nums">{fmtUSD(e.volume24h)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">总交易量</p>
            <p className="font-semibold tabular-nums">{fmtUSD(e.volume)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">流动性</p>
            <p className="font-semibold tabular-nums">{fmtUSD(e.liquidity)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">市场数</p>
            <p className="font-semibold tabular-nums">{e.markets.length}</p>
          </div>
          {e.sourceUrl && (
            <a
              href={e.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto self-center text-sm text-sky-600 hover:underline"
            >
              在 {e.platform.name} 查看原文 →
            </a>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">市场行情</h2>
        <div className="flex flex-col gap-3">
          {e.markets.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{m.question}</p>
                {m.priceChange24h != null && (
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      m.priceChange24h >= 0 ? "text-red-500" : "text-emerald-500"
                    }`}
                  >
                    {fmtChange(m.priceChange24h)}
                  </span>
                )}
              </div>
              <ProbBar outcomes={m.outcomes} prices={m.outcomePrices} />
              <p className="mt-2 text-xs text-zinc-400">
                24h 交易量 {fmtUSD(m.volume24h)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-400">
        概率由市场公开行情换算，仅供信息参考，不构成投资建议。
      </p>
    </div>
  );
}
