'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Tabs, TabsList, TabsTrigger, TabsContent, Sheet, FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries, useAddEntry } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useMonthlyBudget,
  useMonthlyOverview,
  useCategoryBudgetSummaries,
  useWeeklyExpenses,
} from '@/hooks/useMonthlyBudget';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { MonthlyOverview } from '@/components/cashbook/MonthlyOverview';
import { MonthlyExpenseTab } from '@/components/cashbook/MonthlyExpenseTab';
import { MonthlyIncomeTab } from '@/components/cashbook/MonthlyIncomeTab';
import { EntryForm } from '@/components/cashbook/EntryForm';

export default function CashbookMonthlyPage() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const year = dayjs(selectedDate).year();
  const month0 = dayjs(selectedDate).month(); // 0-indexed for cashbook entries
  const month1 = month0 + 1; // 1-indexed for budget

  // 데이터 로딩
  const { data: entries, isPending: entriesPending } = useCashbookEntries(coupleId, year, month0);
  const { data: categories, isPending: categoriesPending } = useCashbookCategories(coupleId);
  const { data: budget, isPending: budgetPending } = useMonthlyBudget(coupleId, year, month1);

  const isLoading = entriesPending || categoriesPending || budgetPending;

  // 파생 데이터
  const budgetItems = budget?.items;
  const overview = useMonthlyOverview(budgetItems, entries);
  const categoryBudgets = useCategoryBudgetSummaries(budgetItems, entries, categories);
  const weeklyExpenses = useWeeklyExpenses(
    budgetItems,
    entries,
    year,
    month1,
    categories ?? undefined
  );

  // 뮤테이션
  const addMutation = useAddEntry(coupleId);

  // 오버레이 핸들러
  const handleAddIrregularIncome = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
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

  const simplifiedCategories = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    subGroup: c.subGroup,
  }));

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
      <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      <div className="mt-4">
        <MonthlyOverview {...overview} />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="expense">
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1">
              지출
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              수입
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="mt-4">
            <MonthlyExpenseTab categoryBudgets={categoryBudgets} weeklyExpenses={weeklyExpenses} />
          </TabsContent>

          <TabsContent value="income" className="mt-4">
            <MonthlyIncomeTab
              budgetItems={budgetItems ?? []}
              entries={entries ?? []}
              categories={simplifiedCategories}
              onAddIrregularIncome={handleAddIrregularIncome}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
