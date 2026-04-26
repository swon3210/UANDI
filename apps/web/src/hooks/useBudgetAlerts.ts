'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { useAtomValue } from 'jotai';
import { Timestamp } from 'firebase/firestore';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries } from './useCashbook';
import { useMonthlyBudget, getBudgetThreshold, type BudgetThreshold } from './useMonthlyBudget';
import { useCashbookCategories } from './useCashbookCategories';
import { useNotificationSettings } from './useNotificationSettings';
import type { BudgetAlert } from '@/components/cashbook/BudgetAlertBanner';
import type { CashbookEntry, MonthlyBudgetItem, CashbookCategory } from '@/types';

// @uidotdev/usehooks의 useLocalStorage는 server snapshot에서 throw하기 때문에
// Next.js prerender 시 빌드가 실패한다. useSyncExternalStore로 SSR 시 null을 반환하고
// 클라이언트에선 localStorage 값을 외부 스토어로 구독한다.
function subscribeToStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function useSsrSafeLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (next: T) => void] {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }, [key]);

  const stored = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    () => null
  );

  const value = useMemo<T>(() => {
    if (stored === null) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
    // initialValue는 caller가 매 렌더 새 객체를 줄 수 있으므로 의존성에서 제외한다.
    // stored가 바뀔 때만 재파싱하면 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const setStored = useCallback(
    (next: T) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        // 같은 탭 내 다른 hook 인스턴스에도 변경을 알리기 위해 storage 이벤트 수동 발행
        window.dispatchEvent(new StorageEvent('storage', { key }));
      } catch {
        // quota / serialization 오류는 무시
      }
    },
    [key]
  );

  return [value, setStored];
}

type Threshold = Exclude<BudgetThreshold, 'safe'>;

function makeKey(scopeId: string, threshold: Threshold): string {
  return `${scopeId}-${threshold}`;
}

function computeAlerts(
  entries: CashbookEntry[],
  budgetItems: MonthlyBudgetItem[],
  categories: CashbookCategory[]
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  const expenseBudgets = budgetItems.filter((b) => b.group === 'expense');
  const actualByCategoryId = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== 'expense') continue;
    const cat = categories.find((c) => c.name === entry.category);
    if (!cat) continue;
    actualByCategoryId.set(cat.id, (actualByCategoryId.get(cat.id) ?? 0) + entry.amount);
  }

  for (const b of expenseBudgets) {
    const cat = categories.find((c) => c.id === b.categoryId);
    if (!cat) continue;
    const actual = actualByCategoryId.get(b.categoryId) ?? 0;
    const t = getBudgetThreshold(b.budgetAmount, actual);
    if (t === 'safe') continue;
    alerts.push({
      key: makeKey(b.categoryId, t),
      scope: 'category',
      label: cat.name,
      threshold: t,
    });
  }

  const totalBudget = expenseBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalActual = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalT = getBudgetThreshold(totalBudget, totalActual);
  if (totalT !== 'safe') {
    alerts.push({
      key: makeKey('total', totalT),
      scope: 'total',
      label: '전체',
      threshold: totalT,
    });
  }

  return alerts;
}

function toastMessageForAlert(alert: BudgetAlert): string {
  if (alert.scope === 'total') {
    if (alert.threshold === 'warn80') return '이번 달 전체 지출이 예산의 80%를 넘었어요';
    if (alert.threshold === 'over100') return '이번 달 전체 지출이 예산을 넘었어요';
    return '이번 달 전체 지출이 예산보다 20% 이상 초과됐어요';
  }
  if (alert.threshold === 'warn80') return `이번 달 ${alert.label}이 예산의 80%를 넘었어요`;
  if (alert.threshold === 'over100') return `이번 달 ${alert.label}이 예산을 넘었어요`;
  return `${alert.label}이 예산보다 20% 이상 초과됐어요`;
}

type AddedExpense = {
  type: string;
  amount: number;
  category: string;
  date?: Timestamp | Date;
};

export function useBudgetAlerts(coupleId: string | null, year: number, month1: number) {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;

  const { data: entries } = useCashbookEntries(coupleId, year, month1 - 1);
  const { data: budget } = useMonthlyBudget(coupleId, year, month1);
  const { data: categories } = useCashbookCategories(coupleId);
  const { data: settings } = useNotificationSettings(uid);

  const enabled = settings?.budgetWarning?.enabled ?? true;
  const budgetItems = budget?.items;

  const allAlerts = useMemo<BudgetAlert[]>(() => {
    if (!enabled) return [];
    if (!entries || !budgetItems || !categories) return [];
    return computeAlerts(entries, budgetItems, categories);
  }, [enabled, entries, budgetItems, categories]);

  const storageKey = `budget-alert-dismissed::${coupleId ?? '__none'}`;
  const [dismissedMap, setDismissedMap] = useSsrSafeLocalStorage<Record<string, boolean>>(
    storageKey,
    {}
  );

  const monthKey = `${year}-${String(month1).padStart(2, '0')}`;

  const visibleAlerts = useMemo(
    () => allAlerts.filter((a) => !dismissedMap[`${monthKey}::${a.key}`]),
    [allAlerts, dismissedMap, monthKey]
  );

  const dismissAlert = (alertKey: string) => {
    setDismissedMap({ ...dismissedMap, [`${monthKey}::${alertKey}`]: true });
  };

  const notifyTransition = (added: AddedExpense) => {
    if (!enabled) return;
    if (added.type !== 'expense') return;
    if (!entries || !budgetItems || !categories) return;

    // 추가된 거래의 날짜가 알림 계산 대상 월과 다르면 임계값 판정이 부정확하므로 토스트를 띄우지 않는다.
    if (added.date) {
      const entryDate = added.date instanceof Timestamp ? added.date.toDate() : added.date;
      if (entryDate.getFullYear() !== year || entryDate.getMonth() + 1 !== month1) return;
    }

    const fakeEntry = {
      type: 'expense',
      amount: added.amount,
      category: added.category,
      id: '__pending__',
      coupleId: '',
      createdBy: '',
      description: '',
    } as unknown as CashbookEntry;

    const before = computeAlerts(entries, budgetItems, categories);
    const after = computeAlerts([...entries, fakeEntry], budgetItems, categories);

    const beforeKeys = new Set(before.map((a) => a.key));
    const newAlerts = after.filter((a) => !beforeKeys.has(a.key));

    for (const alert of newAlerts) {
      toast.warning(toastMessageForAlert(alert), { duration: 4000 });
    }
  };

  return {
    alerts: visibleAlerts,
    dismissAlert,
    notifyTransition,
  };
}
