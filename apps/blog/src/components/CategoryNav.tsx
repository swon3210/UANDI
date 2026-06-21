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

  const segment =
    'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors';
  const active = 'bg-[var(--color-primary)] text-white shadow-sm';
  const inactive = 'text-gray-500 hover:text-gray-800';

  // 카테고리는 상호배타적인 "섹션"이므로 연결된 세그먼트 컨트롤로 표현한다.
  return (
    <div className="overflow-x-auto">
      <nav className="inline-flex gap-1 rounded-full bg-gray-100 p-1">
        <Link href="/" className={cn(segment, !activeCategory ? active : inactive)}>
          전체
        </Link>
        {categories.map((slug) => (
          <Link
            key={slug}
            href={`/categories/${slug}`}
            className={cn(segment, activeCategory === slug ? active : inactive)}
          >
            {CATEGORIES[slug].label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
