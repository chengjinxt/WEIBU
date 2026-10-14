import { fmtPct } from "../lib/format";

interface Props {
  outcomes: unknown;
  prices: unknown;
  compact?: boolean;
}

/** 概率条：展示各选项概率 */
export default function ProbBar({ outcomes, prices }: Props) {
  const outs = (Array.isArray(outcomes) ? outcomes : []).filter(
    (o): o is string => typeof o === "string",
  );
  const prs = (Array.isArray(prices) ? prices : []).filter(
    (p): p is number => typeof p === "number" && Number.isFinite(p),
  );
  if (outs.length === 0 || prs.length === 0) {
    return <span className="text-sm text-zinc-400">暂无概率</span>;
  }
  const rows = outs.map((o, i) => ({ name: o, p: prs[i] ?? 0 })).slice(0, 4);
  // 二元 Yes/No 只突出第一项
  if (rows.length === 2 && rows[0].name.toLowerCase() === "yes") {
    const p = rows[0].p;
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, Math.max(0, p * 100))}%` }}
          />
        </div>
        <span className="w-14 text-right text-sm font-semibold tabular-nums">{fmtPct(p)}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          <span className="w-16 truncate text-xs text-zinc-500 dark:text-zinc-400">{r.name}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${Math.min(100, Math.max(0, r.p * 100))}%` }}
            />
          </div>
          <span className="w-12 text-right text-xs font-medium tabular-nums">{fmtPct(r.p)}</span>
        </div>
      ))}
    </div>
  );
}
