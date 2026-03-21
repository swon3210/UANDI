import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TagBadge({
  tag,
  active = false,
}: {
  tag: string;
  active?: boolean;
}) {
  return (
    <Link
      href={`/tags/${tag}`}
      className={cn(
        'inline-block rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      )}
    >
      {tag}
    </Link>
  );
}
