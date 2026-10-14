// 展示用格式化

/** 美元金额：1234567 -> $1.23M */
export function fmtUSD(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

/** 概率 0~1 -> 百分比，如 0.653 -> 65.3% */
export function fmtPct(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return "-";
  return `${(p * 100).toFixed(1)}%`;
}

/** 24h 变动（分数）-> +2.5% / -1.2% */
export function fmtChange(c: number | null | undefined): string {
  if (c == null || !Number.isFinite(c)) return "-";
  const sign = c > 0 ? "+" : "";
  return `${sign}${(c * 100).toFixed(1)}%`;
}
