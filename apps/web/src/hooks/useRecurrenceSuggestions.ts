'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { formatRecurrence } from '@uandi/cashbook-core/utils/recurrence';
import { useCashbookCategories, useUpdateCategory } from './useCashbookCategories';
import { useCashbookEntriesInRange } from './useCashbook';
import { detectRecurringPatterns } from '@/utils/auto-detect';
import type { RecurrenceSuggestionView } from '@/components/cashbook/RecurrenceSuggestionCard';

const DETECT_MONTHS = 6;
// 정기 발생을 켰는데 이 기간(개월) 동안 발생이 끊기면 "해제 제안" 후보.
const STOPPED_MONTHS = 2;

function kindNoun(type: 'income' | 'expense'): string {
  return type === 'income' ? '정기 수입' : '정기 지출';
}

/**
 * 정기 발생 등록/해제 제안(Phase 6·7) — 영속 예측 doc 없는 읽기 시점 제안.
 * docs/pages/inner/cashflow-recurrence-integration.md 참고.
 * - add: 과거 6개월 `detectRecurringPatterns` 반복 패턴이 잡혔지만 recurrence 미선언 카테고리.
 * - remove: recurrence를 켰지만 최근 {STOPPED_MONTHS}개월 발생이 끊긴(과거엔 ≥2회 있던) 카테고리.
 * - 둘 다 (c) `recurrenceSuggestionDismissed`가 아닌 것만.
 * - accept(add): recurrence 설정 / accept(remove): recurrence 제거 + 닫음 플래그 리셋. dismiss: 닫음 플래그.
 */
export function useRecurrenceSuggestions(coupleId: string | null) {
  const { data: categories } = useCashbookCategories(coupleId);
  const range = useMemo(
    () => ({
      from: dayjs().subtract(DETECT_MONTHS, 'month').startOf('month').toDate(),
      to: dayjs().endOf('day').toDate(),
    }),
    []
  );
  const { data: entries } = useCashbookEntriesInRange(coupleId, range.from, range.to);
  const updateCategory = useUpdateCategory(coupleId);

  const suggestions = useMemo<RecurrenceSuggestionView[]>(() => {
    if (!categories || !entries) return [];
    const out: RecurrenceSuggestionView[] = [];
    const stoppedBefore = dayjs().subtract(STOPPED_MONTHS, 'month');

    // remove 후보: recurrence를 켰는데 최근 발생이 끊긴 카테고리(과거엔 발생하던 것만).
    for (const cat of categories) {
      const r = cat.recurrence;
      if (!r?.enabled) continue;
      if (cat.recurrenceSuggestionDismissed) continue;
      if (cat.group !== 'income' && cat.group !== 'expense') continue;
      const catEntries = entries.filter((e) => e.category === cat.name);
      if (catEntries.length < 2) continue; // 과거에 자리잡은 패턴만(신규 정기 발생 오탐 방지)
      const lastMs = Math.max(...catEntries.map((e) => e.date.toDate().getTime()));
      if (!dayjs(lastMs).isBefore(stoppedBefore)) continue; // 아직 최근에 발생
      out.push({
        categoryId: cat.id,
        categoryName: cat.name,
        type: cat.group,
        kind: 'remove',
        dayOfMonth: r.dayOfMonth ?? 0,
        amount: r.expectedAmount ?? 0,
        scheduleLabel: formatRecurrence(r),
      });
    }

    // add 후보: 반복 패턴이 감지됐지만 recurrence 미선언 카테고리.
    for (const p of detectRecurringPatterns(entries)) {
      if (p.type !== 'income' && p.type !== 'expense') continue;
      const cat = categories.find((c) => c.name === p.category && c.group === p.type);
      if (!cat) continue;
      if (cat.recurrence?.enabled) continue; // 이미 선언됨
      if (cat.recurrenceSuggestionDismissed) continue; // 제안 닫음
      // 최근에도 발생 중인 패턴만 등록 제안(끊긴 패턴은 추천 안 함 — 해제 직후 재추천 방지).
      const lastMs = Math.max(
        ...entries.filter((e) => e.category === p.category).map((e) => e.date.toDate().getTime())
      );
      if (dayjs(lastMs).isBefore(stoppedBefore)) continue;
      out.push({
        categoryId: cat.id,
        categoryName: cat.name,
        type: p.type,
        kind: 'add',
        dayOfMonth: p.dayOfMonth,
        amount: p.amount,
        scheduleLabel: `매월 ${p.dayOfMonth}일쯤`,
      });
    }
    return out;
  }, [categories, entries]);

  const accept = (s: RecurrenceSuggestionView) => {
    if (s.kind === 'remove') {
      updateCategory.mutate(
        {
          categoryId: s.categoryId,
          data: { recurrence: null, recurrenceSuggestionDismissed: false },
        },
        {
          onSuccess: () =>
            toast.success(`'${s.categoryName}' 항목의 ${kindNoun(s.type)} 등록을 해제했어요`),
        }
      );
      return;
    }
    updateCategory.mutate(
      {
        categoryId: s.categoryId,
        data: {
          recurrence: {
            enabled: true,
            kind: 'dayOfMonth',
            dayOfMonth: s.dayOfMonth,
            expectedAmount: s.amount,
          },
        },
      },
      {
        onSuccess: () =>
          toast.success(`'${s.categoryName}' 항목을 ${kindNoun(s.type)}에 등록했어요`),
      }
    );
  };

  const dismiss = (s: RecurrenceSuggestionView) =>
    updateCategory.mutate({
      categoryId: s.categoryId,
      data: { recurrenceSuggestionDismissed: true },
    });

  return { suggestions, accept, dismiss };
}
