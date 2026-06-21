import Link from 'next/link';
import dayjs from 'dayjs';
import { CategoryLabel } from './CategoryLabel';
import type { PostMeta } from '@/lib/posts';

export function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-100 pt-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
        관련 글
      </h2>
      <ul className="space-y-5">
        {posts.map((post) => (
          <li key={post.slug} className="space-y-1">
            <CategoryLabel category={post.category} />
            <Link href={`/posts/${post.slug}`} className="block group">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                {post.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{dayjs(post.date).format('YYYY년 M월 D일')}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
