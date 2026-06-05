'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { CalendarDays, ImageDown, ScanLine } from 'lucide-react';
import {
  Button,
  Sheet,
  EmptyState,
  FullScreenSpinner,
  BudgetVsActualChart,
  IncomeExpensePieChart,
  DailyCumulativeChart,
} from '@uandi/ui';
import { toast } from 'sonner';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries, useAddEntries } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useMonthlyBudget, useCategoryBudgetSummaries } from '@/hooks/useMonthlyBudget';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { SettlementReport, type SettlementChart } from '@/components/cashbook/SettlementReport';
import { ReceiptReconcileSheet } from '@/components/cashbook/ReceiptReconcileSheet';
import { analyzeSpending, parseEntriesFromText } from '@/services/ai';
import { downloadElementAsPng } from '@/lib/export/report';

export default function CashbookSettlementPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const year = dayjs(selectedDate).year();
  const month0 = dayjs(selectedDate).month(); // 0-indexed for entries
  const month1 = month0 + 1; // 1-indexed for budget
  const monthLabel = dayjs(selectedDate).format('YYYY-MM');

  const { data: entries, isPending: entriesPending } = useCashbookEntries(coupleId, year, month0);
  const { data: categories, isPending: categoriesPending } = useCashbookCategories(coupleId);
  const { data: budget, isPending: budgetPending } = useMonthlyBudget(coupleId, year, month1);
  const addManyMutation = useAddEntries(coupleId);

  const openReconcile = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <ReceiptReconcileSheet
          categories={categories ?? []}
          coupleId={coupleId}
          createdBy={user?.uid ?? ''}
          parseFn={parseEntriesFromText}
          onConfirm={(confirmed) => addManyMutation.mutate(confirmed)}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const isLoading = entriesPending || categoriesPending || budgetPending;

  const budgetItems = budget?.items;
  const hasBudget = !!budgetItems && budgetItems.length > 0;
  const categoryBudgets = useCategoryBudgetSummaries(budgetItems, entries, categories);

  // 차트별 캡처 ref (개별 PNG 다운로드 + 보고서 임베드 공용)
  const budgetChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const dailyChartRef = useRef<HTMLDivElement>(null);
  const [exportingChart, setExportingChart] = useState<string | null>(null);

  // 직접 집계 (예산 유무와 무관하게 항상 계산 — 예산 훅의 단락 평가에 의존하지 않음)
  const { incomeActual, expenseActual } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of entries ?? []) {
      if (e.type === 'income') income += e.amount;
      if (e.type === 'expense') expense += e.amount;
    }
    return { incomeActual: income, expenseActual: expense };
  }, [entries]);

  const expenseBudget = useMemo(
    () =>
      (budgetItems ?? [])
        .filter((b) => b.group === 'expense')
        .reduce((sum, b) => sum + b.budgetAmount, 0),
    [budgetItems]
  );

  // 일별 누적 지출 (오늘 이후 날짜는 null → 라인이 오늘에서 멈춤)
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month1, 0).getDate();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month0;
    const isPastMonth =
      year < now.getFullYear() || (year === now.getFullYear() && month0 < now.getMonth());
    const todayCut = isCurrentMonth ? now.getDate() : isPastMonth ? daysInMonth : 0;

    const byDay = new Array(daysInMonth + 1).fill(0);
    for (const e of entries ?? []) {
      if (e.type !== 'expense') continue;
      const d = e.date.toDate().getDate();
      if (d >= 1 && d <= daysInMonth) byDay[d] += e.amount;
    }

    let acc = 0;
    const points = [];
    for (let day = 1; day <= daysInMonth; day++) {
      acc += byDay[day];
      points.push({ day, cumulative: day <= todayCut ? acc : null });
    }
    return points;
  }, [entries, year, month0, month1]);

  const barData = useMemo(
    () =>
      categoryBudgets
        .filter((c) => c.budgetAmount > 0 || c.actualAmount > 0)
        .map((c) => ({
          category: c.categoryName,
          budget: c.budgetAmount,
          actual: c.actualAmount,
        })),
    [categoryBudgets]
  );

  const pieData = useMemo(() => {
    const slices = [];
    if (incomeActual > 0) slices.push({ name: '수입', value: incomeActual });
    if (expenseActual > 0) slices.push({ name: '지출', value: expenseActual });
    return slices;
  }, [incomeActual, expenseActual]);

  const spentPct = expenseBudget > 0 ? Math.round((expenseActual / expenseBudget) * 100) : null;

  const showBudgetChart = hasBudget && barData.length > 0;
  const hasEntries = (entries ?? []).length > 0;

  const aiParams = useMemo(
    () => ({
      entries: (entries ?? []).map((e) => ({
        type: e.type,
        amount: e.amount,
        category: e.category,
        date: dayjs(e.date.toDate()).format('YYYY-MM-DD'),
        description: e.description,
      })),
      year,
      month: month1,
      budget: (budgetItems ?? [])
        .filter((b) => b.group === 'expense')
        .map((b) => {
          const cat = (categories ?? []).find((c) => c.id === b.categoryId);
          return {
            categoryId: b.categoryId,
            budgetAmount: b.budgetAmount,
            category: cat?.name ?? '기타',
          };
        }),
    }),
    [entries, year, month1, budgetItems, categories]
  );

  // 보고서(PDF·Markdown)에 함께 담을 차트 목록
  const reportCharts: SettlementChart[] = [];
  if (showBudgetChart)
    reportCharts.push({ title: '카테고리별 예산 vs 실적', getNode: () => budgetChartRef.current });
  if (pieData.length > 0)
    reportCharts.push({ title: '수입 · 지출 구성', getNode: () => pieChartRef.current });
  if (hasEntries)
    reportCharts.push({ title: '일별 누적 지출', getNode: () => dailyChartRef.current });

  const handleChartPng = async (node: HTMLElement | null, key: string, name: string) => {
    if (!node) return;
    setExportingChart(key);
    try {
      await downloadElementAsPng(node, `settlement-${name}-${monthLabel}.png`);
    } catch {
      toast.error('이미지 저장에 실패했습니다');
    } finally {
      setExportingChart(null);
    }
  };

  if (isLoading) return <FullScreenSpinner />;

  const pngButton = (key: string, name: string, node: () => HTMLElement | null) => (
    <Button
      data-testid={`settlement-png-download-${key}`}
      variant="ghost"
      size="sm"
      onClick={() => handleChartPng(node(), key, name)}
      disabled={exportingChart !== null}
      className="h-7 gap-1 px-2 text-xs text-muted-foreground"
    >
      <ImageDown size={13} />
      PNG
    </Button>
  );

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
      <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* 영수증 대조 점검 진입점 */}
      <Button
        data-testid="settlement-reconcile-btn"
        variant="outline"
        className="mt-4 w-full justify-start gap-2"
        onClick={openReconcile}
      >
        <ScanLine size={16} className="text-primary" />
        영수증으로 내역 점검
      </Button>

      {/* 차트 영역 */}
      <section className="mt-4 space-y-6">
        {/* 예산 vs 실적 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">카테고리별 예산 vs 실적</h2>
            {showBudgetChart && pngButton('budget', 'budget', () => budgetChartRef.current)}
          </div>
          {showBudgetChart ? (
            <div ref={budgetChartRef} className="rounded-xl bg-card p-2">
              <BudgetVsActualChart data={barData} />
            </div>
          ) : (
            <div data-testid="settlement-budget-empty">
              <EmptyState
                icon={<CalendarDays size={40} className="text-muted-foreground" />}
                title="예산 정보가 없어요"
                description="연간 계획을 설정하면 예산 대비 분석을 볼 수 있어요"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/inner/cashbook/plan/annual')}
                  >
                    연간 계획 설정
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* 수입 vs 지출 */}
        {pieData.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">수입 · 지출 구성</h2>
              {pngButton('pie', 'income-expense', () => pieChartRef.current)}
            </div>
            <div ref={pieChartRef} className="rounded-xl bg-card p-2">
              <IncomeExpensePieChart data={pieData} />
            </div>
          </div>
        )}

        {/* 일별 누적 지출 + 예산 천장 */}
        {hasEntries && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold">일별 누적 지출</h2>
              {pngButton('daily', 'daily', () => dailyChartRef.current)}
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              {spentPct !== null
                ? `오늘까지 이번 달 예산의 ${spentPct}%를 썼어요. 선이 예산선에 닿을수록 예산을 다 쓴 거예요.`
                : '쓴 돈이 쌓이는 추이예요. 예산을 설정하면 천장선이 함께 표시돼요.'}
            </p>
            <div ref={dailyChartRef} className="rounded-xl bg-card p-2">
              <DailyCumulativeChart data={dailyData} budgetCeiling={expenseBudget} />
            </div>
          </div>
        )}
      </section>

      {/* AI 결산 보고서 */}
      <section className="mt-8 border-t pt-6">
        <h2 className="mb-3 text-sm font-semibold">AI 결산 보고서</h2>
        {hasEntries ? (
          <SettlementReport
            params={aiParams}
            analyzeFn={analyzeSpending}
            monthLabel={monthLabel}
            charts={reportCharts}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            이번 달 내역이 없어요. 내역을 추가하면 보고서를 만들 수 있어요.
          </p>
        )}
      </section>
    </main>
  );
}
