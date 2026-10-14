import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 本站数据靠定时任务更新，用经典 ISR（export const revalidate）按时间刷新，
     不使用 cacheComponents 新缓存模型 */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
