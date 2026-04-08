import { useState } from 'react';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { Button, Input } from '@uandi/ui';
import { Loader2, Trash2 } from 'lucide-react';
import { GROUP_LABELS } from '@uandi/cashbook-core';
import type {
  CashbookEntry,
  CashbookEntryType,
  CashbookCategory,
  CategoryGroup,
} from '@uandi/cashbook-core';
import { toast } from 'sonner';
import { CategorySelector } from './CategorySelector';

const TYPE_TABS: CashbookEntryType[] = ['expense', 'income', 'investment', 'flex'];

type EditEntryFormProps = {
  entry: CashbookEntry;
  categories: CashbookCategory[] | undefined;
  onUpdate: (
    entryId: string,
    data: Partial<Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>>
  ) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
  onClose: () => void;
};

export function EditEntryForm({
  entry,
  categories,
  onUpdate,
  onDelete,
  onClose,
}: EditEntryFormProps) {
  const [type, setType] = useState<CashbookEntryType>(entry.type);
  const [amount, setAmount] = useState(String(entry.amount));
  const [category, setCategory] = useState(entry.category);
  const [date, setDate] = useState(() => dayjs(entry.date.toDate()).format('YYYY-MM-DD'));
  const [description, setDescription] = useState(entry.description);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const typeCategories =
    categories?.filter((c) => c.group === (type as CategoryGroup)) ?? [];

  const handleUpdate = async () => {
    const numAmount = Number(amount);
    if (!numAmount || !category) return;

    setSubmitting(true);
    try {
      await onUpdate(entry.id, {
        type,
        amount: numAmount,
        category,
        description,
        date: Timestamp.fromDate(dayjs(date).toDate()),
      });
      toast.success('수정되었습니다');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onDelete(entry.id);
      toast.success('삭제되었습니다');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 삭제 확인 */}
      {confirmDelete && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 space-y-2">
          <p className="text-sm text-destructive font-medium">이 내역을 삭제하시겠습니까?</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={submitting}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      )}

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

      {/* 하단 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={handleUpdate}
          disabled={submitting || !amount || !category}
          className="flex-1"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          수정 완료
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setConfirmDelete(true)}
          disabled={submitting}
          className="shrink-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
