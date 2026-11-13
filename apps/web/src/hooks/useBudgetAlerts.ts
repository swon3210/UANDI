'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import { useSubjectParticle } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { useAtomValue } from 'jotai';
import { Timestamp } from 'firebase/firestore';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries } from './useCashbook';
import { useMonthlyBudget, getBudgetThreshold, type BudgetThreshold } from './useMonthlyBudget';
import { useCashbookCategories } from './useCashbookCategories';
import { useNotificationSettings } from './useNotificationSettings';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import type { BudgetAlert } from '@/components/cashbook/BudgetAlertBanner';
import type { CashbookEntry, MonthlyBudgetItem, CashbookCategory } from '@/types';

type Threshold = Exclude<BudgetThreshold, 'safe'>;

function makeKey(scopeId: string, threshold: Threshold): string {
  return `${scopeId}-${threshold}`;
}

type AlertT = ReturnType<typeof useTranslations<'cashbook.budgetAlert'>>;

function computeAlerts(
  entries: CashbookEntry[],
  budgetItems: MonthlyBudgetItem[],
  categories: CashbookCategory[],
  allLabel: string
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
      label: allLabel,
      threshold: totalT,
    });
  }

  return alerts;
}

function toastMessageForAlert(
  alert: BudgetAlert,
  t: AlertT,
  subject: (label: string) => string
): string {
  if (alert.scope === 'total') {
    if (alert.threshold === 'warn80') return t('toastTotalWarn');
    if (alert.threshold === 'over100') return t('toastTotalOver');
    return t('toastTotalOver120');
  }
  if (alert.threshold === 'warn80') return t('toastWarn', { subject: subject(alert.label) });
  if (alert.threshold === 'over100') return t('toastOver', { subject: subject(alert.label) });
  return t('toastOver120', { subject: subject(alert.label) });
}

type AddedExpense = {
  type: string;
  amount: number;
  category: string;
  date?: Timestamp | Date;
};

export function useBudgetAlerts(coupleId: string | null, year: number, month1: number) {
  const t = useTranslations('cashbook.budgetAlert');
  const subject = useSubjectParticle();
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
    return computeAlerts(entries, budgetItems, categories, t('all'));
  }, [enabled, entries, budgetItems, categories, t]);

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

  const dismissAlerts = (alertKeys: string[]) => {
    if (alertKeys.length === 0) return;
    const next = { ...dismissedMap };
    for (const k of alertKeys) next[`${monthKey}::${k}`] = true;
    setDismissedMap(next);
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

    const before = computeAlerts(entries, budgetItems, categories, t('all'));
    const after = computeAlerts([...entries, fakeEntry], budgetItems, categories, t('all'));

    const beforeKeys = new Set(before.map((a) => a.key));
    const newAlerts = after.filter((a) => !beforeKeys.has(a.key));

    for (const alert of newAlerts) {
      toast.warning(toastMessageForAlert(alert, t, subject), { duration: 4000 });
    }
  };

  return {
    alerts: visibleAlerts,
    dismissAlert,
    dismissAlerts,
    notifyTransition,
  };
}
