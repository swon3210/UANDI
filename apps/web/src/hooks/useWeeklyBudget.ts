import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { CashbookEntry, CashbookCategory, MonthlyBudgetItem } from '@/types';
import { getBudgetStatus, type BudgetStatus } from './useMonthlyBudget';

dayjs.extend(isoWeek);

// ── 타입 ──

export type WeekInfo = {
  week: number; // 1-based week number within the month
  start: Dayjs; // 주 시작일 (월요일 or 월 첫째 날)
  end: Dayjs; // 주 종료일 (일요일 or 월 마지막 날)
  days: number; // 주의 일수
};

export type WeeklyBudgetData = {
  weekInfo: WeekInfo;
  budget: number;
  baseBudget: number; // 이월 전 기본 예산
  carryOver: number; // 이월 금액 (양수=절약, 음수=초과)
  spent: number;
  remaining: number;
  percentage: number; // 소진율 (0~100)
  status: BudgetStatus;
};

export type DailyExpense = {
  date: Dayjs;
  dayOfWeek: string; // '월', '화', ...
  total: number;
  entries: CashbookEntry[];
  isFuture: boolean;
  isToday: boolean;
};

export type WeeklyCategorySummary = {
  categoryName: string;
  icon: string;
  total: number;
};

// ── 주(Week) 계산 ──

/**
 * 해당 월의 주 목록을 반환한다.
 * 기준: 월요일 시작, 일요일 종료.
 * 1일이 월요일이 아니면 짧은 주로 시작.
 */
export function getWeeksInMonth(year: number, month: number): WeekInfo[] {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const lastDay = firstDay.endOf('month').startOf('day');
  const weeks: WeekInfo[] = [];

  let weekStart = firstDay;
  let weekNumber = 1;

  while (weekStart.isBefore(lastDay) || weekStart.isSame(lastDay, 'day')) {
    // 이번 주의 끝 = 다음 일요일 or 월말 중 더 빠른 날
    const nextSunday =
      weekStart.isoWeekday() === 7
        ? weekStart // 이미 일요일
        : weekStart.isoWeekday(7); // 이번 주 일요일

    const weekEnd = nextSunday.isAfter(lastDay) ? lastDay : nextSunday;
    const days = weekEnd.diff(weekStart, 'day') + 1;

    weeks.push({
      week: weekNumber,
      start: weekStart,
      end: weekEnd,
      days,
    });

    weekStart = weekEnd.add(1, 'day');
    weekNumber++;
  }

  return weeks;
}

/**
 * 특정 날짜가 해당 월의 몇 주차인지 반환한다.
 */
export function getCurrentWeekNumber(date: Dayjs, weeks: WeekInfo[]): number {
  for (const w of weeks) {
    if (
      (date.isAfter(w.start, 'day') || date.isSame(w.start, 'day')) &&
      (date.isBefore(w.end, 'day') || date.isSame(w.end, 'day'))
    ) {
      return w.week;
    }
  }
  // 기본: 마지막 주
  return weeks[weeks.length - 1]?.week ?? 1;
}

// ── 헬퍼 ──

/**
 * 특정 주의 변동 지출 합계를 계산한다.
 */
function getWeekSpent(
  entries: CashbookEntry[],
  weekInfo: WeekInfo,
  fixedCategoryNames: Set<string>
): number {
  return entries
    .filter((e) => {
      if (e.type !== 'expense') return false;
      if (fixedCategoryNames.has(e.category)) return false;
      const d = dayjs(e.date.toDate());
      return (
        (d.isAfter(weekInfo.start, 'day') || d.isSame(weekInfo.start, 'day')) &&
        (d.isBefore(weekInfo.end, 'day') || d.isSame(weekInfo.end, 'day'))
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

// ── 훅 ──

/**
 * 주간 예산 데이터를 계산하는 훅.
 * 월 변동지출 예산을 주 일수 비례로 분배하고, 이전 주 잔액을 이월한다.
 */
export function useWeeklyBudget(
  budgetItems: MonthlyBudgetItem[] | undefined,
  entries: CashbookEntry[] | undefined,
  categories: CashbookCategory[] | undefined,
  year: number,
  month: number, // 1~12
  weekNumber: number
): WeeklyBudgetData | null {
  return useMemo(() => {
    if (!budgetItems || !entries) return null;

    const weeks = getWeeksInMonth(year, month);
    const weekInfo = weeks.find((w) => w.week === weekNumber);
    if (!weekInfo) return null;

    // 변동 지출 예산 합계
    const variableBudget = budgetItems
      .filter(
        (b) =>
          b.group === 'expense' &&
          (b.subGroup === 'variable_common' || b.subGroup === 'variable_personal')
      )
      .reduce((sum, b) => sum + b.budgetAmount, 0);

    // 고정 지출 카테고리 이름 Set
    const fixedCategoryNames = new Set<string>();
    if (categories) {
      const fixedBudgets = budgetItems.filter(
        (b) => b.group === 'expense' && b.subGroup === 'fixed_expense'
      );
      for (const fb of fixedBudgets) {
        const cat = categories.find((c) => c.id === fb.categoryId);
        if (cat) fixedCategoryNames.add(cat.name);
      }
    }

    // 총 일수 (월 전체)
    const totalDays = weeks.reduce((sum, w) => sum + w.days, 0);

    // 각 주의 기본 예산 (일수 비례)
    const weekBaseBudgets = weeks.map((w) => Math.floor(variableBudget * (w.days / totalDays)));

    // 이전 주들의 이월 누적 계산
    let carryOver = 0;
    for (let i = 0; i < weekNumber - 1; i++) {
      const prevWeekSpent = getWeekSpent(entries, weeks[i], fixedCategoryNames);
      carryOver += weekBaseBudgets[i] - prevWeekSpent;
    }

    const baseBudget = weekBaseBudgets[weekNumber - 1];
    const budget = baseBudget + carryOver;

    // 이번 주 변동 지출
    const spent = getWeekSpent(entries, weekInfo, fixedCategoryNames);

    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
    const status = getBudgetStatus(budget, spent);

    return { weekInfo, budget, baseBudget, carryOver, spent, remaining, percentage, status };
  }, [budgetItems, entries, categories, year, month, weekNumber]);
}

/**
 * 특정 주의 일별 지출 목록을 반환하는 훅.
 */
export function useDailyExpenses(
  entries: CashbookEntry[] | undefined,
  weekInfo: WeekInfo | undefined,
  categories?: CashbookCategory[]
): DailyExpense[] {
  return useMemo(() => {
    if (!entries || !weekInfo) return [];

    const today = dayjs();
    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
    const days: DailyExpense[] = [];

    // 고정 지출 카테고리 이름 Set (제외 대상)
    const fixedCategoryNames = new Set<string>();
    if (categories) {
      for (const cat of categories) {
        if (cat.subGroup === 'fixed_expense') {
          fixedCategoryNames.add(cat.name);
        }
      }
    }

    let current = weekInfo.start;
    while (current.isBefore(weekInfo.end, 'day') || current.isSame(weekInfo.end, 'day')) {
      const dayEntries = entries.filter((e) => {
        if (e.type !== 'expense') return false;
        if (fixedCategoryNames.has(e.category)) return false;
        return dayjs(e.date.toDate()).isSame(current, 'day');
      });
      const total = dayEntries.reduce((sum, e) => sum + e.amount, 0);

      days.push({
        date: current,
        dayOfWeek: DAY_NAMES[current.day()],
        total,
        entries: dayEntries,
        isFuture: current.isAfter(today, 'day'),
        isToday: current.isSame(today, 'day'),
      });

      current = current.add(1, 'day');
    }

    return days;
  }, [entries, weekInfo, categories]);
}

/**
 * 특정 주의 카테고리별 지출 요약을 반환하는 훅.
 */
export function useWeeklyCategorySummary(
  entries: CashbookEntry[] | undefined,
  categories: CashbookCategory[] | undefined,
  weekInfo: WeekInfo | undefined
): WeeklyCategorySummary[] {
  return useMemo(() => {
    if (!entries || !categories || !weekInfo) return [];

    // 고정 지출 카테고리 제외
    const fixedCategoryNames = new Set<string>();
    for (const cat of categories) {
      if (cat.subGroup === 'fixed_expense') {
        fixedCategoryNames.add(cat.name);
      }
    }

    const weekEntries = entries.filter((e) => {
      if (e.type !== 'expense') return false;
      if (fixedCategoryNames.has(e.category)) return false;
      const d = dayjs(e.date.toDate());
      return (
        (d.isAfter(weekInfo.start, 'day') || d.isSame(weekInfo.start, 'day')) &&
        (d.isBefore(weekInfo.end, 'day') || d.isSame(weekInfo.end, 'day'))
      );
    });

    // 카테고리별 합산
    const byCategory = new Map<string, number>();
    for (const e of weekEntries) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    }

    // 카테고리 아이콘 매핑
    const catIconMap = new Map<string, string>();
    for (const c of categories) {
      catIconMap.set(c.name, c.icon);
    }

    return Array.from(byCategory.entries())
      .map(([name, total]) => ({
        categoryName: name,
        icon: catIconMap.get(name) ?? 'circle',
        total,
      }))
      .sort((a, b) => b.total - a.total); // 금액 내림차순
  }, [entries, categories, weekInfo]);
}
