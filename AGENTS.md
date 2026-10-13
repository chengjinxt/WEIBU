<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — 未卜 WEIBU（项目规矩）

项目：中文预测市场信息聚合站（Next.js + Postgres）。只做信息层：聚合展示 Polymarket / Kalshi 公开行情，
不做交易入口、不挂返佣、不做跟单。

## 默认要求

1. 每次改动创建 Git commit（中文信息，格式 `<type>: <说明>`，type 取 feat / fix / chore / docs / refactor / test）。
2. 同步编写/更新测试，交付前全过（`npm test`）。
3. 开发工具不装 C 盘，统一优先 `D:\DevTools`；Node 用 nvm-windows 管理（`nvm install` / `nvm use`），不另装便携 Node。
4. 采集层对第三方 API 做防御性解析：字段缺失 / 类型不符不崩溃，记日志告警。
5. 敏感信息（API Key、数据库连接串、`CRON_SECRET`）只放环境变量 / Vercel 面板，不进代码、不进 Git、不打进日志。

## 合规红线（不可谈判）

- 站内无"去交易 / 去下注"按钮与外链；不挂返佣链接；不收平台推广费。
- 每页显著位置声明：数据仅供信息参考，不构成投资建议。
