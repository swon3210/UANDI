import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TagFilter({
  tags,
  activeTag,
}: {
  tags: string[];
  activeTag?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Link
        href="/"
        className={cn(
          'inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          !activeTag
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        )}
      >
        전체
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/tags/${tag}`}
          className={cn(
            'inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            activeTag === tag
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          )}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
