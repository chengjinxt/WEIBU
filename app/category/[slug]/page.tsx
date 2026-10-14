import { notFound } from "next/navigation";
import type { Metadata } from "next";
import EventCard from "../../../components/EventCard";
import { getEventsByCategory } from "../../../lib/data";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return { title: `${name} - 分类 - 未卜 WEIBU` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const events = await getEventsByCategory(name);
  if (events.length === 0) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-zinc-400">分类</p>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="mt-1 text-sm text-zinc-500">共 {events.length} 个进行中事件，按 24h 交易量排序</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
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
    </div>
  );
}
