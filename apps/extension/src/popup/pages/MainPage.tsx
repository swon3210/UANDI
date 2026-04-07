import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { Button, Input } from '@uandi/ui';
import { ChevronLeft, ChevronRight, Plus, LogOut, Loader2 } from 'lucide-react';
import { formatCurrency, formatAmount } from '@uandi/cashbook-core';
import type { CashbookEntryType } from '@uandi/cashbook-core';
import { useAuth, signOut } from '@/hooks/useAuth';
import {
  useCashbookEntries,
  useAddEntry,
  calcMonthlySummary,
  groupEntriesByDate,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { parseEntryFromText } from '@/lib/ai';
import { toast } from 'sonner';

export function MainPage() {
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const [year, setYear] = useState(() => dayjs().year());
  const [month, setMonth] = useState(() => dayjs().month());
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);

  const { data: entries, isLoading: entriesLoading } = useCashbookEntries(coupleId, year, month);
  const { data: categories } = useCashbookCategories(coupleId);
  const summary = calcMonthlySummary(entries);
  const groupedEntries = groupEntriesByDate(entries);
  const addEntry = useAddEntry(coupleId);

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || !coupleId || !user) return;

    setParsing(true);
    try {
      const categoryNames = categories?.map((c) => c.name) ?? [];
      const parsed = await parseEntryFromText(inputText, categoryNames);

      await addEntry.mutateAsync({
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: Timestamp.fromDate(parsed.date ? new Date(parsed.date) : new Date()),
        createdBy: user.uid,
      });

      setInputText('');
      toast.success('저장되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setParsing(false);
    }
  }, [inputText, coupleId, user, categories, addEntry]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">{user?.displayName}</span>
        <Button variant="ghost" size="icon" onClick={signOut} className="h-7 w-7">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* AI 빠른 입력 */}
      <div className="p-3 border-b space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="예: 점심 15000원"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={parsing}
            className="flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={parsing || !inputText.trim()}
            className="h-9 w-9 shrink-0"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          자연어로 입력하면 AI가 자동 분류합니다
        </p>
      </div>

      {/* 월 네비게이션 + 요약 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-muted-foreground">수입</p>
            <p className="font-medium text-[hsl(var(--income))]">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">지출</p>
            <p className="font-medium text-destructive">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">잔액</p>
            <p className="font-medium">{formatCurrency(summary.balance)}</p>
          </div>
        </div>
      </div>

      {/* 엔트리 목록 */}
      <div className="flex-1 overflow-y-auto">
        {entriesLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : groupedEntries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            내역이 없습니다
          </div>
        ) : (
          groupedEntries.map((group) => (
            <div key={group.date}>
              <div className="px-3 py-1.5 bg-muted/50 text-xs text-muted-foreground sticky top-0">
                {dayjs(group.date).format('M월 D일 (ddd)')}
              </div>
              {group.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{entry.category}</p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium shrink-0 ml-2 ${
                      entry.type === 'income'
                        ? 'text-[hsl(var(--income))]'
                        : 'text-destructive'
                    }`}
                  >
                    {formatAmount(entry.amount, entry.type)}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
