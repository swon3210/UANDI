'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { MascotLoader } from '@/components/MascotLoader';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useAnnualPlan,
  useAnnualPlanItems,
  useBulkUpdatePlanItems,
  useValidateAnnualPlan,
} from '@/hooks/useAnnualPlan';
import { totalsFromItems, ensurePlanItems } from '@/services/annual-plan';
import { BulkEditGrid, type BulkEditRow } from '@/components/cashbook/plan-bulk-edit/BulkEditGrid';
import { BulkEditSummaryBar } from '@/components/cashbook/plan-bulk-edit/BulkEditSummaryBar';
import type { AnnualPlanItem, CashbookCategory } from '@/types';

const ANNUAL_MAIN = '/inner/cashbook/plan/annual';

export default function AnnualPlanBulkEditPage() {
  const router = useRouter();

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { data: categories, isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(coupleId, plan?.id ?? null);

  const finalizeMutation = useBulkUpdatePlanItems(coupleId, plan?.id ?? null);
  const qc = useQueryClient();

  // 카테고리는 있는데 item 이 없는 경우(위저드 이후 추가된 카테고리 등) 백필을 기다린다.
  const hasMissingItems =
    !!categories &&
    !!items &&
    categories.some((c) => !items.some((it) => it.categoryId === c.id));

  const isLoading =
    planPending || catPending || !plan || !categories || !items || itemsPending || hasMissingItems;

  // plan + categories 준비되면 모든 카테고리에 누락된 item 백필 (위저드와 동일)
  const itemsInitRef = useRef(false);
  useEffect(() => {
    if (!plan || !categories || !items || itemsPending) return;
    if (itemsInitRef.current) return;
    itemsInitRef.current = true;
    ensurePlanItems(coupleId!, plan.id, categories, items).then((changed) => {
      if (changed) qc.invalidateQueries({ queryKey: ['annualPlanItems', coupleId, plan.id] });
    });
  }, [plan, categories, items, itemsPending, coupleId, qc]);

  // plan/items 미존재 시 위저드로 redirect (메인 페이지 redirect 로직과 동일 가드)
  useEffect(() => {
    if (!coupleId) return;
    if (planPending) return;
    if (!plan) {
      router.replace(`${ANNUAL_MAIN}/wizard?step=intro`);
      return;
    }
    if (itemsPending) return;
    if (!items || items.length === 0) {
      router.replace(`${ANNUAL_MAIN}/wizard?step=intro`);
      return;
    }
    const hasMissing = items.some(
      (it) => !Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12
    );
    if (hasMissing) router.replace(`${ANNUAL_MAIN}/wizard?step=intro`);
  }, [coupleId, plan, planPending, items, itemsPending, router]);

  return isLoading ? (
    <MascotLoader fullScreen />
  ) : (
    <BulkEditPageInner
      coupleId={coupleId!}
      planId={plan.id}
      uid={uid}
      year={year}
      items={items}
      categories={categories}
      saving={finalizeMutation.isPending}
      onSave={async ({ updates, revision }) => {
        await finalizeMutation.mutateAsync({ updates, revision });
        toast.success('월별 예산을 저장했어요');
        router.replace(ANNUAL_MAIN);
      }}
      onExit={() => router.push(ANNUAL_MAIN)}
    />
  );
}

type SaveArgs = Parameters<ReturnType<typeof useBulkUpdatePlanItems>['mutateAsync']>[0];

type InnerProps = {
  coupleId: string;
  planId: string;
  uid: string;
  year: number;
  items: AnnualPlanItem[];
  categories: CashbookCategory[];
  saving: boolean;
  onSave: (args: SaveArgs) => Promise<void>;
  onExit: () => void;
};

function BulkEditPageInner({
  coupleId,
  planId,
  uid,
  year,
  items,
  categories,
  saving,
  onSave,
  onExit,
}: InnerProps) {
  const categoryById = useMemo(() => {
    const map = new Map<string, CashbookCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  // 페이지 진입 시 1회 캐시되는 원본 스냅샷 (이후 비교/되돌리기 기준)
  const [originalSnapshot] = useState<Record<string, number[]>>(() => {
    const snap: Record<string, number[]> = {};
    for (const it of items) snap[it.id] = it.monthlyAmounts.slice();
    return snap;
  });

  const [draft, setDraft] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = {};
    for (const it of items) init[it.id] = it.monthlyAmounts.slice();
    return init;
  });

  const rows: BulkEditRow[] = useMemo(() => {
    const sortedItems = items.slice().sort((a, b) => {
      const ca = categoryById.get(a.categoryId);
      const cb = categoryById.get(b.categoryId);
      if (!ca || !cb) return 0;
      if (ca.subGroup !== cb.subGroup) return ca.subGroup.localeCompare(cb.subGroup);
      return ca.sortOrder - cb.sortOrder;
    });
    return sortedItems
      .map((it) => {
        const category = categoryById.get(it.categoryId);
        if (!category) return null;
        return {
          itemId: it.id,
          category,
          monthlyAmounts: draft[it.id] ?? it.monthlyAmounts,
          baseline: originalSnapshot[it.id] ?? Array(12).fill(0),
        };
      })
      .filter((r): r is BulkEditRow => r !== null);
  }, [items, categoryById, draft, originalSnapshot]);

  const itemsForValidation: AnnualPlanItem[] = useMemo(
    () =>
      items.map((it) => {
        const monthlyAmounts = draft[it.id] ?? it.monthlyAmounts;
        return {
          ...it,
          monthlyAmounts,
          annualAmount: monthlyAmounts.reduce((s, v) => s + v, 0),
        };
      }),
    [items, draft]
  );

  const validation = useValidateAnnualPlan(itemsForValidation);

  const totalsBefore = useMemo(() => {
    const beforeItems = items.map((it) => ({
      ...it,
      monthlyAmounts: originalSnapshot[it.id] ?? it.monthlyAmounts,
      annualAmount: (originalSnapshot[it.id] ?? it.monthlyAmounts).reduce((s, v) => s + v, 0),
    }));
    return totalsFromItems(beforeItems);
  }, [items, originalSnapshot]);

  const totalsAfter = useMemo(() => totalsFromItems(itemsForValidation), [itemsForValidation]);

  const changedRows = useMemo(
    () => rows.filter((row) => row.monthlyAmounts.some((v, i) => v !== row.baseline[i])),
    [rows]
  );

  const handleChangeRow = (itemId: string, monthlyAmounts: number[]) => {
    setDraft((prev) => ({ ...prev, [itemId]: monthlyAmounts }));
  };

  const handleResetRow = (itemId: string) => {
    setDraft((prev) => ({
      ...prev,
      [itemId]: (originalSnapshot[itemId] ?? Array(12).fill(0)).slice(),
    }));
  };

  const handleResetAll = () => {
    const reset: Record<string, number[]> = {};
    for (const it of items) {
      reset[it.id] = (originalSnapshot[it.id] ?? Array(12).fill(0)).slice();
    }
    setDraft(reset);
  };

  const handleSave = async () => {
    if (changedRows.length === 0 || !validation.ok || saving) return;

    const updates = changedRows.map((row) => ({
      itemId: row.itemId,
      monthlyAmounts: row.monthlyAmounts.slice(),
    }));

    const before: Record<string, number[]> = {};
    const after: Record<string, number[]> = {};
    for (const it of items) {
      before[it.id] = (originalSnapshot[it.id] ?? it.monthlyAmounts).slice();
      after[it.id] = (draft[it.id] ?? it.monthlyAmounts).slice();
    }

    await onSave({
      updates,
      revision: {
        planId,
        coupleId,
        source: 'bulk_edit',
        createdBy: uid,
        before,
        after,
        totals: { before: totalsBefore, after: totalsAfter },
      },
    });
  };

  return (
    <div className={cn('flex min-h-screen flex-col bg-stone-50')}>
      <header
        className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur"
        data-testid="bulk-edit-header"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="뒤로"
            data-testid="bulk-edit-exit"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-stone-900">월별 일괄 수정</div>
            <div className="truncate text-[11px] text-stone-500">
              {year}년 · 카테고리 × 월별 금액 한 번에 조정
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-56">
        <BulkEditGrid rows={rows} onChangeRow={handleChangeRow} onResetRow={handleResetRow} />
      </main>

      <BulkEditSummaryBar
        totalsBefore={totalsBefore}
        totalsAfter={totalsAfter}
        validation={validation}
        changedCount={changedRows.length}
        saving={saving}
        onSave={handleSave}
        onResetAll={handleResetAll}
      />
    </div>
  );
}
