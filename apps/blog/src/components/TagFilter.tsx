import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TagFilter({
  tags,
  activeTag,
}: {
  tags: string[];
  activeTag?: string;
}) {
  const chip =
    'rounded-full border px-3 py-1 text-xs font-medium transition-colors';
  const active = 'border-[var(--color-primary)] text-[var(--color-primary)]';
  const inactive =
    'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700';

  // 태그는 여러 개를 자유롭게 거르는 보조 축이므로, 카테고리와 달리
  // 떨어진 아웃라인 칩(#태그)으로 표현해 시각적으로 구분한다.
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/" className={cn(chip, !activeTag ? active : inactive)}>
        전체
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/tags/${tag}`}
          className={cn(chip, activeTag === tag ? active : inactive)}
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
