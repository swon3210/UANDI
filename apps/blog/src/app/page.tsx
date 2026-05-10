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
  const categories = getAllCategories();
  const tags = getAllTags();
  const allPosts = getAllPosts();
  const restPosts = featured
    ? allPosts.filter((post) => post.slug !== featured.slug)
    : allPosts;

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

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          카테고리
        </h2>
        <CategoryNav categories={categories} />
      </section>

      {tags.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            태그
          </h2>
          <TagFilter tags={tags} />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
          최근 글
        </h2>
        <div className="space-y-8">
          {restPosts.length === 0 ? (
            <p className="text-sm text-gray-400">
              {featured ? '시그니처 글 외에 작성된 글이 없습니다.' : '아직 작성된 글이 없습니다.'}
            </p>
          ) : (
            restPosts.map((post) => (
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
      </section>
    </>
  );
}
