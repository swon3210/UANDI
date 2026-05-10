import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllArchiveMonths,
  getArchiveByMonth,
  getSeriesBySlug,
} from '@/lib/posts';
import { PostCard } from '@/components/PostCard';

type Props = {
  params: Promise<{ 'year-month': string }>;
};

export function generateStaticParams() {
  return getAllArchiveMonths().map((yearMonth) => ({ 'year-month': yearMonth }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'year-month': yearMonth } = await params;
  const archive = getArchiveByMonth(yearMonth);
  if (!archive) {
    return { title: '아카이브를 찾을 수 없습니다 | 독개의 개발블로그' };
  }
  return {
    title: `${archive.label} 아카이브 | 독개의 개발블로그`,
    description: `${archive.label}에 작성된 글 ${archive.posts.length}편`,
  };
}

export default async function ArchiveMonthPage({ params }: Props) {
  const { 'year-month': yearMonth } = await params;
  const archive = getArchiveByMonth(yearMonth);
  if (!archive) notFound();

  const seriesTotalBySlug = new Map<string, number>();
  archive.posts.forEach((post) => {
    if (post.series && !seriesTotalBySlug.has(post.series)) {
      const series = getSeriesBySlug(post.series);
      if (series) seriesTotalBySlug.set(post.series, series.posts.length);
    }
  });

  return (
    <>
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          아카이브
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{archive.label}</h1>
        <p className="mt-1 text-sm text-gray-500">총 {archive.posts.length}편</p>
      </header>

      <div className="space-y-8">
        {archive.posts.map((post) => (
          <PostCard
            key={post.slug}
            post={post}
            seriesTotal={post.series ? seriesTotalBySlug.get(post.series) : undefined}
          />
        ))}
      </div>

      <div className="mt-12 border-t border-gray-100 pt-6">
        <Link
          href="/archive"
          className="text-sm text-gray-500 hover:text-[var(--color-primary)] transition-colors"
        >
          &larr; 아카이브 전체 보기
        </Link>
      </div>
    </>
  );
}
