'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, ArrowUp } from 'lucide-react';
import { Textarea, Button } from '@uandi/ui';

type ParseResult = {
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

type AiParseInputProps = {
  onParsed: (results: ParseResult[]) => void;
  categories: string[];
  parseFn: (text: string, categories: string[]) => Promise<ParseResult[]>;
};

export function AiParseInput({ onParsed, categories, parseFn }: AiParseInputProps) {
  const [text, setText] = useState('');

  const mutation = useMutation({
    mutationFn: (input: string) => parseFn(input, categories),
    onSuccess: (results) => {
      onParsed(results);
      setText('');
    },
  });

  const handleSubmit = () => {
    if (!text.trim() || mutation.isPending) return;
    mutation.mutate(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Sparkles
            size={16}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <Textarea
            data-testid="ai-parse-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'여러 건 입력 가능 (Shift+Enter 줄바꿈)\n예: 점심 김밥 5천원\n어제 택시 15000원'}
            className="pl-9 min-h-[100px] max-h-40"
            rows={1}
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
      {mutation.error && (
        <p className="text-xs text-destructive">
          {mutation.error.message || 'AI 파싱에 실패했습니다'}
        </p>
      )}
    </div>
  );
}
