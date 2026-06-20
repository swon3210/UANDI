'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { ChevronLeft, Plus, MoreVertical, FolderOpen } from 'lucide-react';
import {
  Header,
  Button,
  EmptyState,
  Sheet,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  cn,
} from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories, filterCategoriesByGroup } from '@/hooks/useCashbookCategories';
import {
  useAnnualPlan,
  useAnnualPlanItems,
  useUpsertPlanItem,
  useUpdatePlanItemAmount,
  useDeletePlanItem,
  filterItemsByGroup,
} from '@/hooks/useAnnualPlan';
import { spreadAnnualEvenly } from '@/services/annual-plan';
import { GOAL_CATEGORY_BY_KEY, type GoalCategoryKey } from '@/constants/goal-categories';
import { SUB_GROUP_LABELS } from '@/constants/default-categories';
import { CategoryIcon } from '@/components/cashbook/CategoryIcon';
import { AnnualPlanItemForm } from '@/components/cashbook/AnnualPlanItemForm';
import { formatCurrencyMan } from '@/utils/currency';
import { MascotLoader } from '@/components/MascotLoader';
import type { AnnualPlanItem, CashbookCategory } from '@/types';

const VALID_GROUPS: GoalCategoryKey[] = ['income', 'expense', 'flex'];
const ANNUAL_MAIN = '/inner/cashbook/plan/annual';
const WIZARD_INTRO = `${ANNUAL_MAIN}/wizard?step=intro`;

export default function AnnualPlanItemsPage() {
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <ItemsPageInner />
    </Suspense>
  );
}

function ItemsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawGroup = searchParams.get('group');
  const groupKey = (VALID_GROUPS as string[]).includes(rawGroup ?? '')
    ? (rawGroup as GoalCategoryKey)
    : null;

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { data: categories, isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(coupleId, plan?.id ?? null);

  const upsertMutation = useUpsertPlanItem(coupleId, plan?.id ?? null);
  const updateMutation = useUpdatePlanItemAmount(coupleId, plan?.id ?? null);
  const deleteMutation = useDeletePlanItem(coupleId, plan?.id ?? null);

  useEffect(() => {
    if (!coupleId) return;
    if (groupKey === null) {
      router.replace(ANNUAL_MAIN);
      return;
    }
    if (planPending) return;
    if (!plan) {
      router.replace(WIZARD_INTRO);
    }
  }, [coupleId, groupKey, plan, planPending, router]);

  const groupCategories = useMemo(
    () => (groupKey ? filterCategoriesByGroup(categories, groupKey) : []),
    [categories, groupKey]
  );
  const categoryById = useMemo(
    () => new Map(groupCategories.map((c) => [c.id, c])),
    [groupCategories]
  );
  const groupItems = useMemo(
    () => (groupKey ? filterItemsByGroup(items, groupKey) : []),
    [items, groupKey]
  );

  const sortedRows = useMemo(() => {
    return groupItems
      .map((it) => ({ item: it, category: categoryById.get(it.categoryId) ?? null }))
      .filter((r): r is { item: AnnualPlanItem; category: CashbookCategory } => !!r.category)
      .sort((a, b) => {
        if (a.category.subGroup !== b.category.subGroup) {
          return a.category.subGroup.localeCompare(b.category.subGroup);
        }
        return a.category.sortOrder - b.category.sortOrder;
      });
  }, [groupItems, categoryById]);

  const total = useMemo(() => groupItems.reduce((s, it) => s + it.annualAmount, 0), [groupItems]);

  const availableCategories = useMemo(() => {
    const used = new Set(groupItems.map((it) => it.categoryId));
    return groupCategories.filter((c) => !used.has(c.id));
  }, [groupCategories, groupItems]);

  const rowsBySubGroup = useMemo(() => {
    const map = new Map<string, typeof sortedRows>();
    for (const row of sortedRows) {
      const arr = map.get(row.category.subGroup) ?? [];
      arr.push(row);
      map.set(row.category.subGroup, arr);
    }
    return map;
  }, [sortedRows]);

  if (
    groupKey === null ||
    planPending ||
    catPending ||
    !plan ||
    !categories ||
    (!!plan && itemsPending)
  ) {
    return <MascotLoader fullScreen />;
  }

  const theme = GOAL_CATEGORY_BY_KEY[groupKey];

  const openItemForm = (existing?: AnnualPlanItem) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <AnnualPlanItemForm
          editingItem={existing}
          editingCategory={existing ? (categoryById.get(existing.categoryId) ?? null) : null}
          availableCategories={availableCategories}
          onSubmit={async (data) => {
            const spread = spreadAnnualEvenly(data.annualAmount);
            if (existing) {
              await updateMutation.mutateAsync({
                itemId: existing.id,
                data: spread,
              });
              toast.success('항목을 수정했어요');
              return;
            }
            if (!data.categoryId) return;
            const category = groupCategories.find((c) => c.id === data.categoryId);
            if (!category) return;
            const itemId = `item-${plan.id}-${category.id}`;
            await upsertMutation.mutateAsync({
              itemId,
              data: {
                planId: plan.id,
                coupleId: coupleId!,
                categoryId: category.id,
                group: category.group,
                subGroup: category.subGroup,
                monthlyAmounts: spread.monthlyAmounts,
                inputMode: 'regular',
                baseMonthlyAmount: spread.baseMonthlyAmount,
                annualAmount: spread.annualAmount,
                ownerUid: null,
                updatedAt: Timestamp.now(),
              },
            });
            toast.success('항목을 추가했어요');
          }}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleDelete = (item: AnnualPlanItem, categoryName: string) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            close();
            setTimeout(unmount, 300);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예산 항목 삭제</DialogTitle>
            <DialogDescription>
              &quot;{categoryName}&quot; 항목을 삭제하시겠습니까? 월별 분배도 함께 사라집니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                close();
                setTimeout(unmount, 300);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteMutation.mutateAsync(item.id);
                close();
                setTimeout(unmount, 300);
                toast.success('항목을 삭제했어요');
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ));
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Header
        data-testid="annual-plan-items-header"
        title={`${theme.label} 예산 항목`}
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            data-testid="annual-plan-items-back"
            aria-label="뒤로"
            onClick={() => router.push(ANNUAL_MAIN)}
          >
            <ChevronLeft size={20} />
          </Button>
        }
        rightSlot={
          availableCategories.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              data-testid="annual-plan-items-add"
              aria-label="항목 추가"
              onClick={() => openItemForm()}
            >
              <Plus size={18} />
            </Button>
          ) : null
        }
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-20">
        <div className="mb-4 rounded-2xl border border-stone-200 bg-card p-4">
          <div className="text-xs text-stone-500">{theme.goalLabel}</div>
          <div
            className={cn('mt-1 text-2xl font-bold tabular-nums', theme.accentClass)}
            data-testid="annual-plan-items-total"
          >
            {formatCurrencyMan(total)}원
          </div>
          <div className="mt-0.5 text-xs text-stone-400">{groupItems.length}개 항목</div>
        </div>

        {sortedRows.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={36} />}
            title="등록된 항목이 없어요"
            description="우측 상단 +를 눌러 첫 항목을 추가해보세요"
          />
        ) : (
          <div className="space-y-5">
            {Array.from(rowsBySubGroup.entries()).map(([subGroup, rows]) => (
              <section key={subGroup}>
                <div
                  className="mb-2 px-1 text-[12px] font-semibold text-stone-500"
                  data-testid={`plan-items-subgroup-${subGroup}`}
                >
                  {SUB_GROUP_LABELS[subGroup as keyof typeof SUB_GROUP_LABELS]}
                </div>
                <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-card">
                  {rows.map(({ item, category }) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-3"
                      data-testid={`plan-item-row-${category.name}`}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: category.color + '20',
                          color: category.color,
                        }}
                      >
                        <CategoryIcon name={category.icon} size={18} />
                      </span>
                      <div className="min-w-0 flex-1 truncate text-[14px] font-medium text-stone-900">
                        {category.name}
                      </div>
                      <div
                        className={cn('text-[14px] font-semibold tabular-nums', theme.accentClass)}
                        data-testid={`plan-item-row-${category.name}-amount`}
                      >
                        {formatCurrencyMan(item.annualAmount)}원
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="더보기"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openItemForm(item)}>
                            편집
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item, category.name)}
                          >
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
