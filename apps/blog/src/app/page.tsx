import {
  getAllPosts,
  getAllTags,
  getAllCategories,
  getFeaturedPost,
  getSeriesBySlug,
} from '@/lib/posts';
import { PostCard } from '@/components/PostCard';
import { TagFilter } from '@/components/TagFilter';
import { CategoryNav } from '@/components/CategoryNav';
import { FeaturedPostHero } from '@/components/FeaturedPostHero';
import { HomeIntro } from '@/components/HomeIntro';

export default function BlogHomePage() {
  const featured = getFeaturedPost();
  const allPosts = getAllPosts();
  const restPosts = featured
    ? allPosts.filter((post) => post.slug !== featured.slug)
    : allPosts;

  // 필터/목록은 "넘겨볼 글"이 있을 때만 의미가 있다.
  // 대표글 하나뿐이면 히어로만 보여주고 카테고리·태그·최근 글은 숨긴다.
  const hasMorePosts = restPosts.length > 0;
  const categories = hasMorePosts ? getAllCategories() : [];
  const tags = hasMorePosts ? getAllTags() : [];

  // 시리즈 총편수 미리 계산 (PostCard 뱃지 표시용)
  const seriesTotalBySlug = new Map<string, number>();
  restPosts.forEach((post) => {
    if (post.series && !seriesTotalBySlug.has(post.series)) {
      const series = getSeriesBySlug(post.series);
      if (series) seriesTotalBySlug.set(post.series, series.posts.length);
    }
  });

  return (
    <>
      <HomeIntro />

      {featured ? <FeaturedPostHero post={featured} /> : null}

      {/* 둘러보기 — 카테고리(세그먼트)·태그(칩)를 한 패널로 묶는다 */}
      {categories.length > 1 || tags.length > 1 ? (
        <section className="mt-8 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5">
          {categories.length > 1 ? (
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                카테고리
              </h2>
              <CategoryNav categories={categories} />
            </div>
          ) : null}

          {categories.length > 1 && tags.length > 1 ? (
            <div className="my-4 border-t border-gray-100" />
          ) : null}

          {tags.length > 1 ? (
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                태그
              </h2>
              <TagFilter tags={tags} />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 최근 글 — 대표글 외 다른 글이 있을 때만 */}
      {hasMorePosts ? (
        <section className="mt-10">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
            최근 글
          </h2>
          <div className="space-y-8">
            {restPosts.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
                seriesTotal={
                  post.series ? seriesTotalBySlug.get(post.series) : undefined
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 글이 하나도 없을 때 */}
      {!featured && !hasMorePosts ? (
        <p className="text-sm text-gray-400">아직 작성된 글이 없습니다.</p>
      ) : null}
    </>
  );
}
