import Link from "next/link";
import ProbBar from "./ProbBar";
import { fmtUSD } from "../lib/format";

interface MarketLike {
  question: string;
  outcomes: unknown;
  outcomePrices: unknown;
  volume24h: number | null;
}

interface Props {
  slug: string;
  title: string;
  platformName: string;
  category: string | null;
  volume24h: number;
  marketCount: number;
  topMarket: MarketLike | null;
}

/** 事件卡片：标题 + 平台 + 头部市场概率 + 24h 交易量 */
export default function EventCard({
  slug,
  title,
  platformName,
  category,
  volume24h,
  marketCount,
  topMarket,
}: Props) {
  return (
    <Link
      href={`/event/${encodeURIComponent(slug)}`}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {platformName}
        </span>
        {category && (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            {category}
          </span>
        )}
        <span className="ml-auto text-zinc-400">24h {fmtUSD(volume24h)}</span>
      </div>
      <h3 className="line-clamp-2 text-base font-semibold leading-snug">{title}</h3>
      {topMarket ? (
        <div className="flex flex-col gap-1.5">
          <p className="line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
            {topMarket.question}
          </p>
          <ProbBar outcomes={topMarket.outcomes} prices={topMarket.outcomePrices} />
        </div>
      ) : (
        <p className="text-sm text-zinc-400">暂无市场数据</p>
      )}
      <p className="mt-auto text-xs text-zinc-400">{marketCount} 个市场</p>
    </Link>
  );
}
