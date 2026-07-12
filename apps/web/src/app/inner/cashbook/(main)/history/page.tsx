'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import { BookOpen, FileBarChart, ChevronRight } from 'lucide-react';
import { Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookEntriesInRange,
  useMonthlySummary,
  useFilteredEntries,
  useGroupedEntries,
  useAddEntry,
  useUpdateEntry,
  useDeleteEntry,
  createDefaultFilterState,
  isDateSort,
  type CashbookFilterState,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useCoupleMemberMap, useCoupleMembers } from '@/hooks/useCoupleMembers';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { useDayPredictions, toPromptView } from '@/hooks/useDayPredictions';
import {
  useConfirmPrediction,
  useRejectPrediction,
  useDismissPrompt,
} from '@/hooks/usePredictions';
import { useRecurrencePrompts } from '@/hooks/useRecurrencePrompts';
import { resolvePeriod, formatDay } from '@/utils/date';
import { CashbookFilterBar } from '@/components/cashbook/CashbookFilterBar';
import { CashbookFilterSheet } from '@/components/cashbook/CashbookFilterSheet';
import { MonthlySummary } from '@/components/cashbook/MonthlySummary';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryCard } from '@/components/cashbook/EntryCard';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { PredictionPromptList } from '@/components/cashbook/PredictionPromptList';
import type { PredictionPromptView } from '@/components/cashbook/PredictionPromptBox';
import { formatAmount } from '@/utils/currency';
import type { CashbookEntry, CashbookEntryType, CashbookPrediction } from '@/types';

/**
 * 필터 시트를 쿼리 캐시의 최신 카테고리로 렌더한다.
 * overlay-kit은 open 시점의 props를 클로저로 캡처하므로, 카테고리 로드 전에 열면
 * 빈 목록이 고정되는 레이스가 있다. 시트 안에서 훅을 구독해 로드 완료 시 자동 갱신한다.
 */
function FilterSheetContent({
  coupleId,
  initial,
  onApply,
  onClose,
}: {
  coupleId: string | null;
  initial: CashbookFilterState;
  onApply: (next: CashbookFilterState) => void;
  onClose: () => void;
}) {
  const { data: categories } = useCashbookCategories(coupleId);
  const { data: members } = useCoupleMembers(coupleId);
  return (
    <CashbookFilterSheet
      categories={categories ?? []}
      members={(members ?? []).map((m) => ({
        uid: m.uid,
        displayName: m.displayName,
        photoURL: m.photoURL,
      }))}
      initial={initial}
      onApply={onApply}
      onClose={onClose}
    />
  );
}

export default function CashbookPage() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const [filter, setFilter] = useState<CashbookFilterState>(createDefaultFilterState);
  const range = useMemo(() => resolvePeriod(filter.period), [filter.period]);

  const isFilterActive =
    filter.selectedTypes.length > 0 ||
    filter.selectedCategoryNames.length > 0 ||
    filter.selectedCreatorUids.length > 0 ||
    filter.keyword.trim() !== '';

  const activeFilterCount =
    (filter.selectedTypes.length > 0 ? 1 : 0) +
    (filter.selectedCategoryNames.length > 0 ? 1 : 0) +
    (filter.selectedCreatorUids.length > 0 ? 1 : 0) +
    (filter.keyword.trim() !== '' ? 1 : 0);

  const { data: entries, isLoading: entriesLoading } = useCashbookEntriesInRange(
    coupleId,
    range.start,
    range.end
  );
  const { data: categories, isLoading: categoriesLoading } = useCashbookCategories(coupleId);
  const memberMap = useCoupleMemberMap(coupleId);
  const isLoading = entriesLoading || categoriesLoading;
  const summary = useMonthlySummary(entries);
  const filteredEntries = useFilteredEntries(entries, {
    selectedTypes: filter.selectedTypes,
    selectedCategoryNames: filter.selectedCategoryNames,
    selectedCreatorUids: filter.selectedCreatorUids,
    keyword: filter.keyword,
  });
  const filterSummary = useMonthlySummary(filteredEntries);
  const groups = useGroupedEntries(filteredEntries, filter.sort);

  // 예산 알림 토스트는 항상 현재 달 기준(신규 내역 기본 날짜=오늘).
  const now = useMemo(() => dayjs(), []);
  const { notifyTransition } = useBudgetAlerts(coupleId, now.year(), now.month() + 1);

  // 인라인 월 이동 스테퍼는 month 모드일 때만 노출되며, 이번 달 이후로는 이동 불가.
  const canGoNext =
    filter.period.mode === 'month' &&
    !(filter.period.year === now.year() && filter.period.month === now.month());

  const handlePrevMonth = () => {
    if (filter.period.mode !== 'month') return;
    const prev = dayjs(new Date(filter.period.year, filter.period.month, 1)).subtract(1, 'month');
    setFilter((f) => ({ ...f, period: { mode: 'month', year: prev.year(), month: prev.month() } }));
  };

  const handleNextMonth = () => {
    if (filter.period.mode !== 'month' || !canGoNext) return;
    const next = dayjs(new Date(filter.period.year, filter.period.month, 1)).add(1, 'month');
    setFilter((f) => ({ ...f, period: { mode: 'month', year: next.year(), month: next.month() } }));
  };

  const openFilterSheet = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <FilterSheetContent
          coupleId={coupleId}
          initial={filter}
          onApply={setFilter}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleAllFiltersReset = () => {
    setFilter(createDefaultFilterState());
  };

  const addMutation = useAddEntry(coupleId);
  const updateMutation = useUpdateEntry(coupleId);
  const deleteMutation = useDeleteEntry(coupleId);

  const confirmPredictionMutation = useConfirmPrediction(coupleId);
  const rejectPredictionMutation = useRejectPrediction(coupleId);
  const dismissPromptMutation = useDismissPrompt(coupleId);

  // 표시 기간의 '오늘 이후' 미확정 예측을 날짜별로 묶는다(SYNC-02).
  const promptsByDate = useDayPredictions(coupleId, range.start, range.end);
  // 카테고리 정기 발생을 같은 화면의 "예상 수입/지출" 프롬프트로 읽기 시점에 파생(Phase 4).
  const recurrencePromptsByDate = useRecurrencePrompts(coupleId, range);
  const predictionById = useMemo(() => {
    const m = new Map<string, CashbookPrediction>();
    for (const list of promptsByDate.values()) for (const p of list) m.set(p.id, p);
    return m;
  }, [promptsByDate]);

  const categoryMap = useMemo(
    () => new Map((categories ?? []).map((c) => [c.name, c])),
    [categories]
  );

  // 날짜 정렬 모드에서 거래 그룹 + 예측 프롬프트(doc 기반 + 정기 발생 파생)를 같은 날짜로 합친다.
  const daySections = useMemo(() => {
    if (!isDateSort(filter.sort)) return [];
    const map = new Map<
      string,
      { date: Date; entries: CashbookEntry[]; promptViews: PredictionPromptView[] }
    >();
    for (const g of groups) {
      map.set(dayjs(g.date).format('YYYY-MM-DD'), {
        date: g.date,
        entries: g.entries,
        promptViews: [],
      });
    }
    const pushViews = (key: string, views: PredictionPromptView[]) => {
      const existing = map.get(key);
      if (existing) existing.promptViews.push(...views);
      else map.set(key, { date: dayjs(key).toDate(), entries: [], promptViews: views });
    };
    for (const [key, preds] of promptsByDate) pushViews(key, preds.map(toPromptView));
    for (const [key, views] of recurrencePromptsByDate) pushViews(key, views);
    const dir = filter.sort === 'latest' ? -1 : 1;
    return [...map.values()].sort((a, b) => (a.date.getTime() - b.date.getTime()) * dir);
  }, [groups, promptsByDate, recurrencePromptsByDate, filter.sort]);

  const handleAdd = (prefill?: {
    type?: CashbookEntryType;
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
  }) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
          createdBy={uid}
          prefill={prefill}
          onSubmit={(data) => addMutation.mutate(data, { onSuccess: () => notifyTransition(data) })}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  // 푸시 알림 딥링크(quickAdd=1)로 진입하면 prefill된 추가 시트를 1회 자동으로 연다.
  // 카테고리 로드 후 열어야 prefill 카테고리가 선택되므로 categories를 기다린다.
  // 외부 트리거(URL)에 반응하는 일회성 동작이라 effect + ref 가드를 사용한다.
  const searchParams = useSearchParams();
  const quickAddHandledRef = useRef(false);
  useEffect(() => {
    if (quickAddHandledRef.current) return;
    if (searchParams.get('quickAdd') !== '1') return;
    if (!categories) return;
    quickAddHandledRef.current = true;

    const qaType = searchParams.get('qaType');
    const type: CashbookEntryType = qaType === 'income' || qaType === 'flex' ? qaType : 'expense';
    const amountRaw = searchParams.get('qaAmount');
    const amount = amountRaw && Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : undefined;

    handleAdd({
      type,
      category: searchParams.get('qaCategory') ?? undefined,
      amount,
    });

    // 새로고침/뒤로가기 시 시트가 다시 열리지 않도록 쿼리 제거
    window.history.replaceState(null, '', '/inner/cashbook/history');
    // handleAdd는 매 렌더 새로 생성되어 deps에서 제외(일회성 가드로 충분)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categories]);

  const handleEntryClick = (entry: CashbookEntry) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
          editingEntry={entry}
          createdBy={uid}
          onSubmit={(data) => {
            updateMutation.mutate({
              entryId: entry.id,
              data: {
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
              },
            });
          }}
          onDelete={() => deleteMutation.mutate(entry.id)}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  // ✓ 추가: doc 예측은 정식 거래로 확정(SYNC-03). 정기 발생 파생은 "기록하기"=예상값 그대로 원탭 기록.
  const handlePromptConfirm = (view: PredictionPromptView) => {
    if (view.kind === 'recurrence') {
      const date = Timestamp.fromDate(view.date);
      addMutation.mutate(
        {
          createdBy: uid,
          type: view.type,
          amount: view.amount,
          category: view.category,
          description: '',
          date,
        },
        {
          onSuccess: () =>
            notifyTransition({
              type: view.type,
              amount: view.amount,
              category: view.category,
              date,
            }),
        }
      );
      return;
    }
    const p = predictionById.get(view.id);
    if (p) confirmPredictionMutation.mutate({ prediction: p });
  };

  // ✗ 아니오: calendar 출처는 프롬프트만 닫고(캘린더 잔존, SYNC-04), auto 출처는 거절(양쪽 제거).
  // 정기 발생 파생엔 ✗ 버튼이 없으므로 호출되지 않는다.
  const handlePromptReject = (view: PredictionPromptView) => {
    if (view.kind === 'recurrence') return;
    const p = predictionById.get(view.id);
    if (!p) return;
    if (p.source === 'calendar') dismissPromptMutation.mutate(p.id);
    else rejectPredictionMutation.mutate(p.id);
  };

  // ✎ 수정 후 추가/기록: EntryForm을 prefill로 열어 수정값으로 저장.
  // - doc 예측: 수정값으로 확정(시나리오 E). - 정기 발생 파생: prefill 추가 시트로 금액 등 조정 후 기록.
  const handlePromptEdit = (view: PredictionPromptView) => {
    if (view.kind === 'recurrence') {
      handleAdd({
        type: view.type,
        amount: view.amount,
        category: view.category,
        date: dayjs(view.date).format('YYYY-MM-DD'),
      });
      return;
    }
    const p = predictionById.get(view.id);
    if (!p) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
          createdBy={uid}
          title="수정 후 추가"
          prefill={{
            type: p.type,
            amount: p.amount,
            category: p.category,
            description: p.description,
            date: dayjs(p.date.toDate()).format('YYYY-MM-DD'),
          }}
          onSubmit={(data) =>
            confirmPredictionMutation.mutate({
              prediction: p,
              override: {
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
              },
            })
          }
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const listEmptyState = isFilterActive ? (
    <EmptyState
      icon={<BookOpen size={48} className="text-muted-foreground" />}
      title="조건에 맞는 내역이 없어요"
      description="다른 필터를 시도해보세요"
      action={
        <Button variant="outline" onClick={handleAllFiltersReset}>
          필터 초기화
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<BookOpen size={48} className="text-muted-foreground" />}
      title="아직 내역이 없어요"
      description="가계부를 시작해보세요"
      action={
        <Button onClick={() => handleAdd()} data-testid="empty-add-entry-button">
          추가하기
        </Button>
      }
    />
  );

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
      <Button
        asChild
        variant="outline"
        className="h-auto w-full justify-start gap-3 py-3"
        data-testid="history-review-link"
      >
        <Link href="/inner/cashbook/review">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileBarChart size={18} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col items-start">
            <span className="text-sm font-medium text-foreground">내역 점검</span>
            <span className="whitespace-normal text-left text-xs leading-snug text-muted-foreground">
              누락·중복된 내역이 없는지 확인하고 채우기
            </span>
          </span>
          <ChevronRight size={18} aria-hidden className="ml-auto shrink-0 text-muted-foreground" />
        </Link>
      </Button>

      <div className="mt-4">
        <CashbookFilterBar
          period={filter.period}
          periodLabel={range.label}
          activeCount={activeFilterCount}
          canGoNext={canGoNext}
          sort={filter.sort}
          onSortChange={(sort) => setFilter((f) => ({ ...f, sort }))}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onOpen={openFilterSheet}
        />
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-[108px] rounded-xl" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <MonthlySummary
              income={summary.income}
              expense={summary.expense}
              balance={summary.balance}
            />
            {isFilterActive && (
              <div
                data-testid="filter-result-summary"
                className="mt-1.5 flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-xs"
              >
                <span className="text-muted-foreground">필터 결과 {filteredEntries.length}건</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {filterSummary.income > 0 && (
                    <span className="text-income">
                      {formatAmount(filterSummary.income, 'income')}
                    </span>
                  )}
                  {filterSummary.expense > 0 && (
                    <span className="text-expense">
                      {formatAmount(filterSummary.expense, 'expense')}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            {isDateSort(filter.sort) ? (
              daySections.length > 0 ? (
                <div className="space-y-5">
                  {daySections.map((s) => (
                    <div key={dayjs(s.date).format('YYYY-MM-DD')}>
                      <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                        {formatDay(s.date)}
                      </div>
                      {s.promptViews.length > 0 && (
                        <div className="mb-2">
                          <PredictionPromptList
                            prompts={s.promptViews}
                            onConfirm={handlePromptConfirm}
                            onReject={handlePromptReject}
                            onEdit={handlePromptEdit}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        {s.entries.map((entry) => (
                          <EntryCard
                            key={entry.id}
                            entry={entry}
                            category={categoryMap.get(entry.category)}
                            onClick={handleEntryClick}
                            author={memberMap.get(entry.createdBy)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                listEmptyState
              )
            ) : groups.length > 0 ? (
              <EntryList
                groups={groups}
                categories={categories ?? []}
                onEntryClick={handleEntryClick}
                showDateHeaders={false}
                members={memberMap}
              />
            ) : (
              listEmptyState
            )}
          </div>
        </>
      )}
    </main>
  );
}
