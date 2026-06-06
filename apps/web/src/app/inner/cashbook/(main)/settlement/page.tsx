'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { CalendarDays, ImageDown, CheckCircle2, Loader2, ListChecks } from 'lucide-react';
import {
  Button,
  EmptyState,
  FullScreenSpinner,
  BudgetVsActualChart,
  IncomeExpensePieChart,
  DailyCumulativeChart,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@uandi/ui';
import { toast } from 'sonner';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useMonthlyBudget, useCategoryBudgetSummaries } from '@/hooks/useMonthlyBudget';
import {
  useSettlement,
  useCompleteSettlement,
  useRedoSettlement,
  useRemoveSettlementAttachment,
  monthKeyOf,
} from '@/hooks/useSettlement';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { SettlementReport, type SettlementChart } from '@/components/cashbook/SettlementReport';
import { SettlementSummaryHeader } from '@/components/cashbook/SettlementSummaryHeader';
import { SettlementAttachmentGallery } from '@/components/cashbook/SettlementAttachmentGallery';
import { SettlementReportView } from '@/components/cashbook/SettlementReportView';
import { analyzeSpending } from '@/services/ai';
import { downloadElementAsPng } from '@/lib/export/report';
import type { CategoryGroup, SettlementReportSnapshot } from '@/types';

// 지출 분석 대상 그룹 — 지출 + FLEX (참조 안정성 위해 모듈 상수)
const SPENDING_GROUPS: CategoryGroup[] = ['expense', 'flex'];

function parseMonthParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const d = dayjs(`${value}-01`);
  return d.isValid() ? d.toDate() : null;
}

export default function CashbookSettlementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  // ?month=YYYY-MM 으로 진입하면 해당 달을 1회 선택 (URL 동기화)
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => parseMonthParam(searchParams.get('month')) ?? new Date()
  );
  const [aiAnalysis, setAiAnalysis] = useState('');

  const year = dayjs(selectedDate).year();
  const month0 = dayjs(selectedDate).month(); // 0-indexed (entries)
  const month1 = month0 + 1; // 1-indexed (budget/settlement)
  const monthLabel = dayjs(selectedDate).format('YYYY-MM');
  const monthKey = monthKeyOf(year, month1);

  const handleMonthChange = (date: Date) => {
    setSelectedDate(date);
    setAiAnalysis(''); // 달이 바뀌면 직전 달 AI 분석 캡처를 초기화
  };

  const { data: entries, isPending: entriesPending } = useCashbookEntries(coupleId, year, month0);
  const { data: categories, isPending: categoriesPending } = useCashbookCategories(coupleId);
  const { data: budget, isPending: budgetPending } = useMonthlyBudget(coupleId, year, month1);
  const { data: settlement, isPending: settlementPending } = useSettlement(coupleId, monthKey);

  const completeMutation = useCompleteSettlement(coupleId);
  const redoMutation = useRedoSettlement(coupleId);
  const removeAttachment = useRemoveSettlementAttachment(coupleId);

  const isLoading =
    entriesPending || categoriesPending || budgetPending || settlementPending;

  const budgetItems = budget?.items;
  const hasBudget = !!budgetItems && budgetItems.length > 0;
  const categoryBudgets = useCategoryBudgetSummaries(
    budgetItems,
    entries,
    categories,
    SPENDING_GROUPS
  );

  // 차트별 캡처 ref (개별 PNG 다운로드 + 보고서 임베드 공용)
  const budgetChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const dailyChartRef = useRef<HTMLDivElement>(null);
  const [exportingChart, setExportingChart] = useState<string | null>(null);

  // 직접 집계 (예산 유무와 무관하게 항상 계산)
  const { incomeActual, expenseActual, flexActual } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let flex = 0;
    for (const e of entries ?? []) {
      if (e.type === 'income') income += e.amount;
      else if (e.type === 'expense') expense += e.amount;
      else if (e.type === 'flex') flex += e.amount;
    }
    return { incomeActual: income, expenseActual: expense, flexActual: flex };
  }, [entries]);

  const spendingActual = expenseActual + flexActual;

  // 지출 천장 = 지출 + FLEX 예산 합
  const spendingBudget = useMemo(
    () =>
      (budgetItems ?? [])
        .filter((b) => b.group === 'expense' || b.group === 'flex')
        .reduce((sum, b) => sum + b.budgetAmount, 0),
    [budgetItems]
  );

  // 일별 누적 (지출 + FLEX, 오늘 이후 날짜는 null → 라인이 오늘에서 멈춤)
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month1, 0).getDate();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month0;
    const isPastMonth =
      year < now.getFullYear() || (year === now.getFullYear() && month0 < now.getMonth());
    const todayCut = isCurrentMonth ? now.getDate() : isPastMonth ? daysInMonth : 0;

    const byDay = new Array(daysInMonth + 1).fill(0);
    for (const e of entries ?? []) {
      if (e.type !== 'expense' && e.type !== 'flex') continue;
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
    if (flexActual > 0) slices.push({ name: 'FLEX', value: flexActual });
    return slices;
  }, [incomeActual, expenseActual, flexActual]);

  const spentPct =
    spendingBudget > 0 ? Math.round((spendingActual / spendingBudget) * 100) : null;

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
        .filter((b) => b.group === 'expense' || b.group === 'flex')
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
    reportCharts.push({ title: '수입 · 지출 · FLEX 구성', getNode: () => pieChartRef.current });
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

  const buildReport = (): Omit<SettlementReportSnapshot, 'completedAt'> => ({
    totals: { income: incomeActual, expense: expenseActual, flex: flexActual },
    spending: spendingActual,
    budgetCeiling: spendingBudget,
    spentPct,
    barData,
    pieData,
    dailyData,
    aiAnalysis,
    entryCount: (entries ?? []).length,
  });

  const handleComplete = () => {
    overlay.open(({ isOpen, close, unmount }) => {
      const dismiss = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
          <DialogContent data-testid="settlement-complete-dialog">
            <DialogHeader>
              <DialogTitle>이번 달 결산을 완료할까요?</DialogTitle>
              <DialogDescription>
                완료하면 첨부한 영수증·스크린샷은 삭제되고 결산 보고서가 저장돼요. 보고서는 “다시
                결산하기”로 언제든 수정할 수 있어요.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="secondary" onClick={dismiss}>
                취소
              </Button>
              <Button
                data-testid="settlement-complete-confirm"
                onClick={() => {
                  completeMutation.mutate({
                    year,
                    month: month1,
                    report: buildReport(),
                    attachments: settlement?.attachments ?? [],
                  });
                  dismiss();
                }}
              >
                결산 완료
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    });
  };

  if (isLoading) return <FullScreenSpinner />;

  const isCompleted = settlement?.status === 'completed' && !!settlement.report;

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
      <MonthSelector selectedDate={selectedDate} onChange={handleMonthChange} />

      {isCompleted ? (
        <div className="mt-2">
          <SettlementReportView
            report={settlement.report!}
            monthLabel={monthLabel}
            onRedo={() => redoMutation.mutate(monthKey)}
            isRedoing={redoMutation.isPending}
          />
        </div>
      ) : (
        <>
          {/* 수입 · 지출 · FLEX 요약 */}
          <div className="mt-2">
            <SettlementSummaryHeader
              income={incomeActual}
              expense={expenseActual}
              flex={flexActual}
            />
          </div>

          {/* 이번 달 내역 확인·추가 (별도 페이지에서 영수증 첨부·내역 추가) */}
          <Button
            data-testid="settlement-entries-link"
            variant="outline"
            className="mt-4 w-full justify-start gap-2"
            onClick={() => router.push(`/inner/cashbook/settlement/entries?month=${monthKey}`)}
          >
            <ListChecks size={16} className="text-primary" />
            이번 달 내역 확인·추가
          </Button>

          {/* 첨부 갤러리 (결산 완료 전까지 유지) */}
          <div className="mt-3">
            <SettlementAttachmentGallery
              attachments={settlement?.attachments ?? []}
              onRemove={(att) => removeAttachment.mutate({ monthKey, attachment: att })}
              removingId={
                removeAttachment.isPending ? removeAttachment.variables?.attachment.id : null
              }
            />
          </div>

          {/* 차트 영역 */}
          <section className="mt-6 space-y-6">
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

            {/* 수입 · 지출 · FLEX */}
            {pieData.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">수입 · 지출 · FLEX 구성</h2>
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
                  <DailyCumulativeChart data={dailyData} budgetCeiling={spendingBudget} />
                </div>
              </div>
            )}
          </section>

          {/* AI 결산 보고서 */}
          <section className="mt-8 border-t pt-6">
            <h2 className="mb-3 text-sm font-semibold">AI 결산 보고서</h2>
            {hasEntries ? (
              <SettlementReport
                key={monthLabel}
                params={aiParams}
                analyzeFn={analyzeSpending}
                monthLabel={monthLabel}
                charts={reportCharts}
                onContentChange={setAiAnalysis}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                이번 달 내역이 없어요. 내역을 추가하면 보고서를 만들 수 있어요.
              </p>
            )}
          </section>

          {/* 결산 완료 */}
          <div className="mt-8">
            <Button
              data-testid="settlement-complete-btn"
              size="lg"
              className="w-full gap-2"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              결산 완료
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              완료하면 첨부 이미지는 삭제되고 보고서가 저장돼요.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
