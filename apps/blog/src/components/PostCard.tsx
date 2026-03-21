import Link from 'next/link';
import dayjs from 'dayjs';
import { TagBadge } from './TagBadge';
import type { PostMeta } from '@/lib/posts';

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-gray-400">{dayjs(post.date).format('YYYY년 M월 D일')}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{post.summary}</p>
        <div className="flex gap-2 pt-1">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </article>
    </Link>
  );
}
