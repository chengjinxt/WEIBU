import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "未卜 WEIBU - 中文预测市场信息聚合",
  description:
    "聚合 Polymarket、Kalshi 公开行情的中文预测市场信息站：热门事件、24h 异动榜、分类与搜索。数据仅供信息参考，不构成投资建议。",
};

function SearchBox() {
  return (
    <form action="/search" method="get" className="flex items-center">
      <input
        name="q"
        placeholder="搜索事件或问题…"
        className="w-40 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:w-56 focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900 sm:w-56"
      />
    </form>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              未卜 <span className="text-sm font-medium text-zinc-400">WEIBU</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              <Link href="/" className="hover:text-black dark:hover:text-white">
                首页
              </Link>
              <Link href="/about" className="hover:text-black dark:hover:text-white">
                关于
              </Link>
            </nav>
            <div className="ml-auto">
              <SearchBox />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-200 py-6 dark:border-zinc-800">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-zinc-500 dark:text-zinc-400">
            <p>
              数据来源：Polymarket、Kalshi 公开行情。本站仅做信息聚合展示，不提供交易入口、不涉及资金。
            </p>
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              数据仅供信息参考，不构成投资建议。
            </p>
            <p>
              <Link href="/about" className="underline hover:text-black dark:hover:text-white">
                关于本站与免责声明
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
