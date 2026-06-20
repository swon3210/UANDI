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
      {featured ? <FeaturedPostHero post={featured} /> : null}

      {/* 카테고리 — 거를 카테고리가 2종류 이상일 때만 */}
      {categories.length > 1 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            카테고리
          </h2>
          <CategoryNav categories={categories} />
        </section>
      ) : null}

      {/* 태그 — 거를 태그가 2개 이상일 때만 */}
      {tags.length > 1 ? (
        <section className="mt-6 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            태그
          </h2>
          <TagFilter tags={tags} />
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
