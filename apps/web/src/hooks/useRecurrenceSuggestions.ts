'use client';

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { formatRecurrence } from '@uandi/cashbook-core/utils/recurrence';
import { useCashbookCategories, useUpdateCategory } from './useCashbookCategories';
import { useCashbookEntriesInRange } from './useCashbook';
import { addCategory } from '@/services/cashbook-categories';
import { bulkUpdateEntriesCategory } from '@/services/cashbook';
import {
  RECURRENCE_SUBGROUPS,
  SUB_GROUP_LABELS,
  recurrenceSubGroupFor,
} from '@/constants/default-categories';
import { detectRecurringPatterns } from '@/utils/auto-detect';
import type { RecurrenceSuggestionView } from '@/components/cashbook/RecurrenceSuggestionCard';
import type { CashbookCategory, RecurringSchedule } from '@/types';

const DETECT_MONTHS = 6;
// 정기 발생을 켰는데 이 기간(개월) 동안 발생이 끊기면 "해제 제안" 후보.
const STOPPED_MONTHS = 2;

function kindNoun(type: 'income' | 'expense'): string {
  return type === 'income' ? '정기 수입' : '정기 지출';
}

/**
 * 정기 발생 등록/이동/해제 제안(Phase 6·7) — 영속 예측 doc 없는 읽기 시점 제안.
 * docs/pages/inner/cashflow-recurrence-integration.md 참고.
 * - add: 과거 6개월 `detectRecurringPatterns` 반복 패턴이 잡혔지만 recurrence 미선언인
 *   고정 지출/정기 수입 카테고리.
 * - move: 같은 패턴이 변동 지출/비정기 수입 카테고리에서 잡힌 경우. 그 카테고리에 recurrence를
 *   붙이는 대신 새 고정 지출/정기 수입 카테고리를 만들어 패턴 내역을 옮기도록 안내한다
 *   (수락 UI는 페이지가 `CategoryForm` 시트로 열고 `useMoveRecurrenceToNewCategory`로 저장).
 * - remove: recurrence를 켰지만 최근 {STOPPED_MONTHS}개월 발생이 끊긴(과거엔 ≥2회 있던) 카테고리.
 * - 모두 `recurrenceSuggestionDismissed`가 아닌 것만.
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
        sourceSubGroup: cat.subGroup,
        kind: 'remove',
        dayOfMonth: r.dayOfMonth ?? 0,
        amount: r.expectedAmount ?? 0,
        scheduleLabel: formatRecurrence(r),
        entryIds: [],
      });
    }

    // add/move 후보: 반복 패턴이 감지됐지만 recurrence 미선언 카테고리.
    // 고정 지출/정기 수입이면 그 카테고리에 등록(add), 변동/비정기면 새 고정 카테고리로 이동(move).
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
        sourceSubGroup: cat.subGroup,
        kind: RECURRENCE_SUBGROUPS.includes(cat.subGroup) ? 'add' : 'move',
        dayOfMonth: p.dayOfMonth,
        amount: p.amount,
        scheduleLabel: `매월 ${p.dayOfMonth}일쯤`,
        entryIds: p.entryIds,
      });
    }
    return out;
  }, [categories, entries]);

  const accept = (s: RecurrenceSuggestionView) => {
    // move는 사용자가 새 카테고리 이름·아이콘을 정해야 해서 one-tap으로 처리하지 않는다.
    // 페이지가 CategoryForm 시트를 열고 useMoveRecurrenceToNewCategory로 저장한다.
    if (s.kind === 'move') return;
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

export type MoveRecurrenceInput = {
  suggestion: RecurrenceSuggestionView;
  /** 새로 만들 고정 지출/정기 수입 카테고리(subGroup·group·parent는 훅이 정한다). */
  category: Pick<CashbookCategory, 'name' | 'icon' | 'color' | 'description' | 'examples'> & {
    sortOrder: number;
    recurrence: RecurringSchedule | null;
  };
};

/**
 * 'move' 제안 수락: 새 고정 지출/정기 수입 카테고리를 만들고 패턴 내역을 그 카테고리로 옮긴다.
 * 원래의 변동 카테고리는 건드리지 않는다(recurrence도 붙이지 않음). 내역이 옮겨지면 변동 카테고리에서는
 * 패턴이 사라져 제안이 자연히 소멸하고, 새 카테고리는 recurrence가 있어 캘린더 ◇ 예측에 바로 반영된다.
 */
export function useMoveRecurrenceToNewCategory(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ suggestion, category }: MoveRecurrenceInput) => {
      const name = category.name.trim();
      await addCategory(coupleId!, {
        group: suggestion.type,
        subGroup: recurrenceSubGroupFor(suggestion.type),
        name,
        icon: category.icon,
        color: category.color,
        isDefault: false,
        sortOrder: category.sortOrder,
        parentCategoryId: null,
        description: category.description,
        examples: category.examples,
        recurrence: category.recurrence,
      });
      const moved = await bulkUpdateEntriesCategory(coupleId!, suggestion.entryIds, name);
      return { name, moved };
    },
    onSuccess: ({ name, moved }, { suggestion }) => {
      qc.invalidateQueries({ queryKey: ['cashbookCategories', coupleId] });
      qc.invalidateQueries({ queryKey: ['cashbookEntries', coupleId] });
      const targetLabel = SUB_GROUP_LABELS[recurrenceSubGroupFor(suggestion.type)];
      toast.success(`'${name}' ${targetLabel} 카테고리를 만들고 내역 ${moved}건을 옮겼어요`);
    },
    onError: () => toast.error('카테고리를 만들지 못했어요. 다시 시도해주세요.'),
  });
}
