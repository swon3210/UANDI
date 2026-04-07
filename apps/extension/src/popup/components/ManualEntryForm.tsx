import { useState } from 'react';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { Button, Input } from '@uandi/ui';
import { Loader2 } from 'lucide-react';
import { GROUP_LABELS } from '@uandi/cashbook-core';
import type {
  CashbookEntry,
  CashbookEntryType,
  CashbookCategory,
  CategoryGroup,
} from '@uandi/cashbook-core';
import { toast } from 'sonner';
import type { UseMutationResult } from '@tanstack/react-query';
import { CategorySelector } from './CategorySelector';

const TYPE_TABS: CashbookEntryType[] = ['expense', 'income', 'investment', 'flex'];

type ManualEntryFormProps = {
  uid: string;
  categories: CashbookCategory[] | undefined;
  addEntry: UseMutationResult<string, Error, Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'>>;
  onSuccess: () => void;
};

export function ManualEntryForm({ uid, categories, addEntry, onSuccess }: ManualEntryFormProps) {
  const [type, setType] = useState<CashbookEntryType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const typeCategories =
    categories?.filter((c) => c.group === (type as CategoryGroup)) ?? [];

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || !category) return;

    setSubmitting(true);
    try {
      await addEntry.mutateAsync({
        type,
        amount: numAmount,
        category,
        description,
        date: Timestamp.fromDate(dayjs(date).toDate()),
        createdBy: uid,
      });

      setAmount('');
      setCategory('');
      setDescription('');
      setDate(dayjs().format('YYYY-MM-DD'));
      onSuccess();
      toast.success('저장되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3 overflow-y-auto max-h-[380px]">
      {/* 타입 탭 */}
      <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
        {TYPE_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory('');
            }}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              type === t
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {GROUP_LABELS[t as CategoryGroup]}
          </button>
        ))}
      </div>

      {/* 금액 */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">금액</label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          className="text-right text-base font-semibold"
          autoFocus
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">카테고리</label>
        <CategorySelector
          categories={typeCategories}
          activeType={type}
          value={category}
          onChange={setCategory}
        />
      </div>

      {/* 날짜 */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">날짜</label>
        <Input
          type="date"
          value={date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* 메모 */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          메모 (선택)
        </label>
        <Input
          placeholder="메모를 입력하세요"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* 저장 */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || !amount || !category}
        className="w-full"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        저장
      </Button>
    </div>
  );
}
