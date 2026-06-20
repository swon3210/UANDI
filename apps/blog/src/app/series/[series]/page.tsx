import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSeriesBySlug } from '@/lib/posts';
import { isSeriesSlug, SERIES } from '@/lib/taxonomy';
import { PostCard } from '@/components/PostCard';

type Props = {
  params: Promise<{ series: string }>;
};

export function generateStaticParams() {
  return Object.keys(SERIES).map((series) => ({ series }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series } = await params;
  if (!isSeriesSlug(series)) {
    return { title: '시리즈를 찾을 수 없습니다 | Doggae Log' };
  }
  return {
    title: `${SERIES[series].title} | Doggae Log`,
    description: `${SERIES[series].title} 시리즈 목차`,
  };
}

export default async function SeriesPage({ params }: Props) {
  const { series } = await params;
  if (!isSeriesSlug(series)) notFound();

  const ctx = getSeriesBySlug(series);
  if (!ctx) notFound();

  return (
    <>
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          시리즈
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{ctx.title}</h1>
        <p className="mt-1 text-sm text-gray-500">총 {ctx.posts.length}편</p>
      </header>
      <div className="space-y-8">
        {ctx.posts.map((post) => (
          <PostCard key={post.slug} post={post} seriesTotal={ctx.posts.length} />
        ))}
      </div>
    </>
  );
}
