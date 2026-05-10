import Link from 'next/link';
import { CATEGORIES, type CategorySlug } from '@/lib/taxonomy';

export function CategoryLabel({
  category,
  asLink = true,
}: {
  category: CategorySlug;
  asLink?: boolean;
}) {
  const label = CATEGORIES[category].label;
  const className =
    'text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]';

  if (!asLink) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      href={`/categories/${category}`}
      className={`${className} hover:underline`}
    >
      {label}
    </Link>
  );
}
