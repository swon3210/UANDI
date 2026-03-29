'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/ko';
import { Plus, Tag, CalendarDays, Bell, CalendarX2, AlertCircle } from 'lucide-react';
import { Header, Button, Sheet, FullScreenSpinner, EmptyState } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries, useAddEntry } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useMonthlyBudget } from '@/hooks/useMonthlyBudget';
import {
  getWeeksInMonth,
  getCurrentWeekNumber,
  useWeeklyBudget,
  useDailyExpenses,
  useWeeklyCategorySummary,
} from '@/hooks/useWeeklyBudget';
import { CashbookSubNav } from '@/components/cashbook/CashbookSubNav';
import { WeekSelector } from '@/components/cashbook/WeekSelector';
import { WeeklySummaryCard } from '@/components/cashbook/WeeklySummaryCard';
import { DailyExpenseList } from '@/components/cashbook/DailyExpenseList';
import { WeeklyCategoryBreakdown } from '@/components/cashbook/WeeklyCategoryBreakdown';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { BottomNav } from '@/components/BottomNav';

dayjs.extend(isoWeek);
dayjs.locale('ko');

export default function CashbookWeeklyPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  // 현재 날짜 기준으로 월/주 초기화
  const today = dayjs();
  const [year, setYear] = useState(today.year());
  const [month, setMonth] = useState(today.month() + 1); // 1~12

  const weeks = getWeeksInMonth(year, month);
  const initialWeek = year === today.year() && month === today.month() + 1
    ? getCurrentWeekNumber(today, weeks)
    : 1;
  const [weekNumber, setWeekNumber] = useState(initialWeek);

  // 데이터 로딩
  const { data: entries, isPending: entriesPending, isError: entriesError } = useCashbookEntries(coupleId, year, month - 1); // 0-indexed
  const { data: categories, isPending: categoriesPending, isError: categoriesError } = useCashbookCategories(coupleId);
  const { data: budget, isPending: budgetPending, isError: budgetError } = useMonthlyBudget(coupleId, year, month);

  const isLoading = entriesPending || categoriesPending || budgetPending;
  const isError = entriesError || categoriesError || budgetError;

  // 파생 데이터
  const budgetItems = budget?.items;
  const weeklyData = useWeeklyBudget(budgetItems, entries, categories, year, month, weekNumber);
  const dailyExpenses = useDailyExpenses(entries, weeklyData?.weekInfo, categories);
  const categorySummary = useWeeklyCategorySummary(entries, categories, weeklyData?.weekInfo);

  // 뮤테이션
  const addMutation = useAddEntry(coupleId);

  // 주 이동
  const handlePrevWeek = () => {
    if (weekNumber > 1) {
      setWeekNumber(weekNumber - 1);
    } else {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevWeeks = getWeeksInMonth(prevYear, prevMonth);
      setYear(prevYear);
      setMonth(prevMonth);
      setWeekNumber(prevWeeks.length);
    }
  };

  const handleNextWeek = () => {
    if (weekNumber < weeks.length) {
      setWeekNumber(weekNumber + 1);
    } else {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      setYear(nextYear);
      setMonth(nextMonth);
      setWeekNumber(1);
    }
  };

  // 현재 주보다 미래인지 확인
  const isCurrentOrFutureWeek = (() => {
    if (year > today.year()) return true;
    if (year === today.year() && month > today.month() + 1) return true;
    if (year === today.year() && month === today.month() + 1) {
      const currentWeeks = getWeeksInMonth(today.year(), today.month() + 1);
      const currentWeekNum = getCurrentWeekNumber(today, currentWeeks);
      return weekNumber >= currentWeekNum;
    }
    return false;
  })();

  // 지출 추가 오버레이
  const handleAddExpense = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          createdBy={uid}
          onSubmit={(data) => addMutation.mutate(data)}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  if (isLoading) return <FullScreenSpinner />;

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <EmptyState
          icon={<AlertCircle size={48} />}
          title="데이터를 불러올 수 없습니다"
          description="잠시 후 다시 시도해주세요"
          action={<Button onClick={() => window.location.reload()}>새로고침</Button>}
        />
      </div>
    );
  }

  const catSimple = (categories ?? []).map((c) => ({ name: c.name, icon: c.icon }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="가계부"
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push('/cashbook/weekly/notifications')}
            aria-label="알림 설정"
          >
            <Bell size={20} />
          </Button>
        }
        rightSlot={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push('/cashbook/plan/annual')}
              aria-label="연간 계획"
            >
              <CalendarDays size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push('/cashbook/categories')}
              aria-label="카테고리 설정"
            >
              <Tag size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddExpense}
              aria-label="추가"
              data-testid="add-entry-button"
            >
              <Plus size={20} />
            </Button>
          </div>
        }
      />

      <CashbookSubNav />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-2 pb-20 space-y-5">
        {weeklyData && (
          <>
            <WeekSelector
              month={month}
              weekInfo={weeklyData.weekInfo}
              onPrev={handlePrevWeek}
              onNext={handleNextWeek}
              isNextDisabled={isCurrentOrFutureWeek}
            />

            <WeeklySummaryCard
              budget={weeklyData.budget}
              carryOver={weeklyData.carryOver}
              spent={weeklyData.spent}
              remaining={weeklyData.remaining}
              percentage={weeklyData.percentage}
              status={weeklyData.status}
            />

            <DailyExpenseList days={dailyExpenses} categories={catSimple} />

            <WeeklyCategoryBreakdown categories={categorySummary} />

            <Button className="w-full" onClick={handleAddExpense}>
              + 지출 추가
            </Button>
          </>
        )}

        {!weeklyData && (
          <EmptyState
            icon={<CalendarX2 size={48} />}
            title="예산 데이터가 없습니다"
            description="연간 계획을 먼저 설정해주세요"
            action={
              <Button onClick={() => router.push('/cashbook/plan/annual')}>
                연간 계획 설정
              </Button>
            }
          />
        )}
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}
