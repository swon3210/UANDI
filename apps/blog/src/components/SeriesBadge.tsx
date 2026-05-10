import Link from 'next/link';
import { SERIES, type SeriesSlug } from '@/lib/taxonomy';

export function SeriesBadge({
  series,
  order,
  total,
}: {
  series: SeriesSlug;
  order?: number;
  total?: number;
}) {
  const title = SERIES[series].title;
  const suffix = order && total ? ` · ${order}/${total}` : '';

  return (
    <Link
      href={`/series/${series}`}
      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
    >
      <span>📚</span>
      <span>
        {title}
        {suffix}
      </span>
    </Link>
  );
}
