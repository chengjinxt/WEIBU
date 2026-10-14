import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于本站与免责声明 - 未卜 WEIBU",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-bold">关于未卜 WEIBU</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">这是什么</h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          未卜 WEIBU 是一个中文预测市场信息聚合站。它定时抓取 Polymarket、Kalshi
          两家预测市场平台的<strong>公开行情</strong>（事件、市场、概率、交易量），翻译整理后用中文呈现，
          帮你快速看到全球预测市场在关注什么、概率在怎么变。
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">数据来源与更新</h2>
        <ul className="list-disc pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <li>Polymarket：经其公开的 Gamma API 获取（无需登录的公开接口）。</li>
          <li>Kalshi：经其公开的 Trade API v2 获取（公开行情无需认证）。</li>
          <li>事件行情每日同步；热门市场价格快照每 5 分钟更新。</li>
          <li>页面数据最多延迟约 5 分钟，与平台实时行情可能存在差异。</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="text-lg font-semibold">免责声明</h2>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
          <p>
            1. 本站所有数据<strong>仅供信息参考，不构成投资建议</strong>。预测市场的概率反映的是市场参与者的集体预期，不代表事件实际发生的可能性，也不保证未来结果。
          </p>
          <p>
            2. 本站<strong>不提供交易入口、不提供返佣链接、不做跟单、不接触任何资金</strong>。请勿通过非正规渠道参与境外预测市场交易，注意识别诈骗。
          </p>
          <p>
            3. 行情数据来源于第三方公开接口，可能存在延迟、缺失或错误，本站不对数据的准确性、完整性作任何保证。
          </p>
          <p>4. 中文翻译由程序自动生成，仅供阅读参考，请以平台原文为准。</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">联系与反馈</h2>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          公测期间欢迎反馈数据问题与改进建议。
        </p>
      </section>
    </div>
  );
}
