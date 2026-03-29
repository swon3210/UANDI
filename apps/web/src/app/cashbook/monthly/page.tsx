'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Plus, Tag, CalendarDays, Bell } from 'lucide-react';
import {
  Header,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Sheet,
  FullScreenSpinner,
} from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntries, useAddEntry } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useMonthlyBudget, useMonthlyOverview, useCategoryBudgetSummaries, useWeeklyExpenses } from '@/hooks/useMonthlyBudget';
import { useCashBalances, useUpsertCashBalance } from '@/hooks/useCashBalance';
import { CashbookSubNav } from '@/components/cashbook/CashbookSubNav';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { MonthlyOverview } from '@/components/cashbook/MonthlyOverview';
import { MonthlyExpenseTab } from '@/components/cashbook/MonthlyExpenseTab';
import { MonthlyIncomeTab } from '@/components/cashbook/MonthlyIncomeTab';
import { MonthlyInvestmentTab } from '@/components/cashbook/MonthlyInvestmentTab';
import { InvestmentEntryForm } from '@/components/cashbook/InvestmentEntryForm';
import { CashBalanceForm } from '@/components/cashbook/CashBalanceForm';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { BottomNav } from '@/components/BottomNav';

export default function CashbookMonthlyPage() {
  const router = useRouter();
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
  const { data: cashBalances } = useCashBalances(coupleId, year, month1);

  const isLoading = entriesPending || categoriesPending || budgetPending;

  // 파생 데이터
  const budgetItems = budget?.items;
  const overview = useMonthlyOverview(budgetItems, entries);
  const categoryBudgets = useCategoryBudgetSummaries(budgetItems, entries, categories);
  const weeklyExpenses = useWeeklyExpenses(budgetItems, entries, year, month1, categories ?? undefined);

  // 뮤테이션
  const addMutation = useAddEntry(coupleId);
  const upsertBalance = useUpsertCashBalance(coupleId);

  // 오버레이 핸들러
  const handleAddIrregularIncome = () => {
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

  const handleAddInvestment = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <InvestmentEntryForm
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

  const handleUpdateBalance = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CashBalanceForm
          categories={categories ?? []}
          currentBalances={cashBalances ?? []}
          year={year}
          month={month1}
          onSubmit={(balances) => {
            for (const b of balances) {
              upsertBalance.mutate({
                coupleId: coupleId ?? '',
                categoryId: b.categoryId,
                year,
                month: month1,
                balance: b.balance,
              });
            }
          }}
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
    <div className="flex min-h-screen flex-col">
      <Header
        title="가계부"
        rightSlot={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push('/cashbook/weekly/notifications')}
              aria-label="알림 설정"
            >
              <Bell size={20} />
            </Button>
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
              onClick={handleAddIrregularIncome}
              aria-label="추가"
              data-testid="add-entry-button"
            >
              <Plus size={20} />
            </Button>
          </div>
        }
      />

      <CashbookSubNav />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />

        <div className="mt-4">
          <MonthlyOverview {...overview} />
        </div>

        <div className="mt-6">
          <Tabs defaultValue="expense">
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">지출</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">수입</TabsTrigger>
              <TabsTrigger value="investment" className="flex-1">재테크</TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="mt-4">
              <MonthlyExpenseTab
                categoryBudgets={categoryBudgets}
                weeklyExpenses={weeklyExpenses}
              />
            </TabsContent>

            <TabsContent value="income" className="mt-4">
              <MonthlyIncomeTab
                budgetItems={budgetItems ?? []}
                entries={entries ?? []}
                categories={simplifiedCategories}
                onAddIrregularIncome={handleAddIrregularIncome}
              />
            </TabsContent>

            <TabsContent value="investment" className="mt-4">
              <MonthlyInvestmentTab
                budgetItems={budgetItems ?? []}
                entries={entries ?? []}
                cashBalances={cashBalances ?? []}
                categories={simplifiedCategories}
                onAddInvestment={handleAddInvestment}
                onUpdateBalance={handleUpdateBalance}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}
