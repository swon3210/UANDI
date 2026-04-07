import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Button, Input } from '@uandi/ui';
import { Loader2, Sparkles, ArrowUp } from 'lucide-react';
import type { CashbookCategory } from '@uandi/cashbook-core';
import { parseEntryFromText } from '@/lib/ai';
import { toast } from 'sonner';
import type { UseMutationResult } from '@tanstack/react-query';
import type { CashbookEntry } from '@uandi/cashbook-core';

type AiInputProps = {
  uid: string;
  categories: CashbookCategory[] | undefined;
  addEntry: UseMutationResult<string, Error, Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'>>;
  onSuccess: () => void;
};

export function AiInput({ uid, categories, addEntry, onSuccess }: AiInputProps) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setParsing(true);
    try {
      const categoryNames = categories?.map((c) => c.name) ?? [];
      const parsed = await parseEntryFromText(text, categoryNames);

      await addEntry.mutateAsync({
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: Timestamp.fromDate(parsed.date ? new Date(parsed.date) : new Date()),
        createdBy: uid,
      });

      setText('');
      onSuccess();
      toast.success('저장되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="점심 김치찌개 9000원"
            className="pl-9"
            disabled={parsing}
            autoFocus
          />
        </div>
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={parsing || !text.trim()}
        >
          {parsing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        자연어로 입력하면 AI가 자동 분류합니다
      </p>
    </div>
  );
}
