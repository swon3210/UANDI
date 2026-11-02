'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { CashbookCategory, CashbookEntry } from '@/types';
import { EntryCard } from '@/components/cashbook/EntryCard';
import type { EntryAuthor } from '@/components/cashbook/AuthorAvatar';

export const RECENT_ENTRIES_LIMIT = 3;

type RecentEntriesCardProps = {
  /** 현재 기간의 내역. 날짜 내림차순으로 정렬해 앞 3건만 보여준다. */
  entries: CashbookEntry[];
  categories?: CashbookCategory[];
  /** "전체 보기"와 행 클릭이 가는 곳(내역 화면) */
  historyHref: string;
  /** uid → 작성자. 전달되면 행마다 작성자 아바타를 붙인다(누가 적었는지 — 6구간 걷기). */
  authors?: ReadonlyMap<string, EntryAuthor>;
  onSelect?: (entry: CashbookEntry) => void;
  className?: string;
};

/**
 * 대시보드 전체 탭의 최근 내역 카드.
 * 방금 적은 내역이 요약 숫자로만 녹아 "어디 갔지?"가 되지 않게, 최근 3건을 그대로 보여준다.
 * 내역이 없으면 아무것도 그리지 않는다(빈 상태는 대시보드 빈 상태 카드가 맡는다).
 */
export function RecentEntriesCard({
  entries,
  categories = [],
  historyHref,
  authors,
  onSelect,
  className,
}: RecentEntriesCardProps) {
  // Storybook의 firebase 목 Timestamp에는 toMillis가 없어 toDate()로 비교한다
  const recent = [...entries]
    .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
    .slice(0, RECENT_ENTRIES_LIMIT);
  if (recent.length === 0) return null;

  const categoryOf = (entry: CashbookEntry) =>
    categories.find((c) => c.name === entry.category && c.group === entry.type);

  return (
    <section
      data-testid="recent-entries"
      className={['rounded-xl border border-border bg-card p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs text-muted-foreground">최근 내역</h3>
        <Link
          href={historyHref}
          data-testid="recent-entries-all"
          className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          전체 보기
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
      <div className="space-y-2">
        {recent.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            category={categoryOf(entry)}
            author={authors?.get(entry.createdBy)}
            showDate
            onClick={(e) => onSelect?.(e)}
          />
        ))}
      </div>
    </section>
  );
}
