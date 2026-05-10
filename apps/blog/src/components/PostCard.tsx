import Link from 'next/link';
import dayjs from 'dayjs';
import { TagBadge } from './TagBadge';
import { CategoryLabel } from './CategoryLabel';
import { ReadingTime } from './ReadingTime';
import { SeriesBadge } from './SeriesBadge';
import type { PostMeta } from '@/lib/posts';

export function PostCard({
  post,
  seriesTotal,
}: {
  post: PostMeta;
  seriesTotal?: number;
}) {
  return (
    <article className="space-y-2">
      <CategoryLabel category={post.category} />
      <Link href={`/posts/${post.slug}`} className="block group">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
          {post.title}
        </h2>
      </Link>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>{dayjs(post.date).format('YYYY년 M월 D일')}</span>
        <span>·</span>
        <ReadingTime minutes={post.readingTimeMinutes} />
      </div>
      <Link href={`/posts/${post.slug}`} className="block">
        <p className="text-sm text-gray-600 leading-relaxed hover:text-gray-800 transition-colors">
          {post.summary}
        </p>
      </Link>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {post.series ? (
          <SeriesBadge
            series={post.series}
            order={post.seriesOrder}
            total={seriesTotal}
          />
        ) : null}
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
    </article>
  );
}
