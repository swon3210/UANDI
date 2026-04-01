'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, ArrowUp } from 'lucide-react';
import { Input, Button } from '@uandi/ui';

type ParseResult = {
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

type AiParseInputProps = {
  onParsed: (result: ParseResult) => void;
  categories: string[];
  parseFn: (text: string, categories: string[]) => Promise<ParseResult>;
};

export function AiParseInput({ onParsed, categories, parseFn }: AiParseInputProps) {
  const [text, setText] = useState('');

  const mutation = useMutation({
    mutationFn: (input: string) => parseFn(input, categories),
    onSuccess: (result) => {
      onParsed(result);
      setText('');
    },
  });

  const handleSubmit = () => {
    if (!text.trim() || mutation.isPending) return;
    mutation.mutate(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
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
            data-testid="ai-parse-input"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="점심 김치찌개 9000원"
            className="pl-9"
            disabled={mutation.isPending}
          />
        </div>
        <Button
          data-testid="ai-parse-submit"
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim() || mutation.isPending}
          aria-label="AI 파싱"
        >
          {mutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} />
          )}
        </Button>
      </div>
      {mutation.data && mutation.data.confidence < 0.7 && (
        <p className="text-xs text-amber-500" data-testid="ai-low-confidence">
          정확하지 않을 수 있어요. 결과를 확인해주세요.
        </p>
      )}
      {mutation.error && (
        <p className="text-xs text-destructive">
          {mutation.error.message || 'AI 파싱에 실패했습니다'}
        </p>
      )}
    </div>
  );
}
