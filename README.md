# 未卜 WEIBU

中文预测市场信息聚合站：聚合 Polymarket / Kalshi 公开行情，做中文展示、概率走势、异动榜、跨平台比价。
**只做信息层**——不做交易入口、不挂返佣、不做跟单。

实现方案见 `docs/实现方案.md`。

## 快速开始

```bash
npm install
cp .env.example .env        # 填 DATABASE_URL / CRON_SECRET
npm run db:generate
npm run db:migrate
npm run ingest fetch-test   # 不写库，验证 API 解析
npm run ingest sync         # 全量事件同步入库
npm run dev
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run ingest fetch-test` | 调真实 API，只解析不入库 |
| `npm run ingest sync [--limit=N]` | 同步热门事件+市场入库 |
| `npm run ingest snapshot [--limit=N]` | 给 Top 市场写价格快照 |
| `npm test` | 跑单测（解析器等） |
| `npm run db:migrate` | Prisma 建表/迁移 |
