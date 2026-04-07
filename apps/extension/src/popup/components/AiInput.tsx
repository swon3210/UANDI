import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Button, Input } from '@uandi/ui';
import { Loader2, Sparkles } from 'lucide-react';
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
    <div className="p-3 border-b space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="예: 점심 15000원"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={parsing}
          className="flex-1 text-sm"
          autoFocus
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={parsing || !text.trim()}
          className="h-9 w-9 shrink-0"
        >
          {parsing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        자연어로 입력하면 AI가 자동 분류합니다
      </p>
    </div>
  );
}
