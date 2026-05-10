import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllCategories,
  getPostsByCategory,
  getSeriesBySlug,
} from '@/lib/posts';
import { CATEGORIES, isCategorySlug, CATEGORY_SLUGS } from '@/lib/taxonomy';
import { CategoryNav } from '@/components/CategoryNav';
import { PostCard } from '@/components/PostCard';

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  // 정의된 모든 카테고리에 대해 정적 생성 (빈 카테고리도 fallback 페이지 제공)
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategorySlug(category)) {
    return { title: '카테고리를 찾을 수 없습니다 | 독개의 개발블로그' };
  }
  const meta = CATEGORIES[category];
  return {
    title: `${meta.label} | 독개의 개발블로그`,
    description: meta.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();

  const categories = getAllCategories();
  const posts = getPostsByCategory(category);
  const meta = CATEGORIES[category];

  // 같은 시리즈 카운트(시리즈 뱃지의 X/총개수 표시용)
  const seriesTotalBySlug = new Map<string, number>();
  posts.forEach((post) => {
    if (post.series && !seriesTotalBySlug.has(post.series)) {
      const series = getSeriesBySlug(post.series);
      if (series) seriesTotalBySlug.set(post.series, series.posts.length);
    }
  });

  return (
    <>
      <CategoryNav categories={categories} activeCategory={category} />
      <header className="mt-6 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{meta.label}</h1>
        <p className="mt-1 text-sm text-gray-500">{meta.description}</p>
      </header>
      <div className="mt-6 space-y-8">
        {posts.length === 0 ? (
          <p className="text-sm text-gray-400">이 카테고리의 글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              seriesTotal={
                post.series ? seriesTotalBySlug.get(post.series) : undefined
              }
            />
          ))
        )}
      </div>
    </>
  );
}
