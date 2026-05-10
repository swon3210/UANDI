import Link from 'next/link';
import { CATEGORIES, type CategorySlug } from '@/lib/taxonomy';
import { cn } from '@/lib/utils';

export function CategoryNav({
  categories,
  activeCategory,
}: {
  categories: CategorySlug[];
  activeCategory?: CategorySlug;
}) {
  if (categories.length === 0) return null;

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      <Link
        href="/"
        className={cn(
          'inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          !activeCategory
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        )}
      >
        전체
      </Link>
      {categories.map((slug) => (
        <Link
          key={slug}
          href={`/categories/${slug}`}
          className={cn(
            'inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            activeCategory === slug
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          {CATEGORIES[slug].label}
        </Link>
      ))}
    </nav>
  );
}
