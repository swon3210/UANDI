import { useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '@uandi/ui';
import { Plus, LogOut, Sparkles, X } from 'lucide-react';
import { useAuth, signOut } from '@/hooks/useAuth';
import {
  useCashbookEntries,
  useAddEntry,
  calcMonthlySummary,
  groupEntriesByDate,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { AiInput } from '../components/AiInput';
import { ManualEntryForm } from '../components/ManualEntryForm';
import { MonthlySummary } from '../components/MonthlySummary';
import { EntryList } from '../components/EntryList';

type InputMode = 'closed' | 'ai' | 'manual';

export function MainPage() {
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const [year, setYear] = useState(() => dayjs().year());
  const [month, setMonth] = useState(() => dayjs().month());
  const [inputMode, setInputMode] = useState<InputMode>('closed');

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

  const closeInput = () => setInputMode('closed');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">{user?.displayName}</span>
        <div className="flex items-center gap-1">
          {inputMode === 'closed' ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInputMode('ai')}
                className="h-7 w-7"
                title="AI 빠른 입력"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInputMode('manual')}
                className="h-7 w-7"
                title="직접 입력"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeInput}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} className="h-7 w-7">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 입력 영역 */}
      {inputMode === 'ai' && user && (
        <AiInput
          uid={user.uid}
          categories={categories}
          addEntry={addEntry}
          onSuccess={closeInput}
        />
      )}
      {inputMode === 'manual' && user && (
        <ManualEntryForm
          uid={user.uid}
          categories={categories}
          addEntry={addEntry}
          onSuccess={closeInput}
        />
      )}

      {/* 월별 요약 */}
      <MonthlySummary
        year={year}
        month={month}
        summary={summary}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* 내역 목록 */}
      <div className="flex-1 overflow-y-auto">
        <EntryList groupedEntries={groupedEntries} isLoading={entriesLoading} />
      </div>
    </div>
  );
}
