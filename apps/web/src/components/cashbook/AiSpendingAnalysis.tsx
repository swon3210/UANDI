'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from '@uandi/ui';
import type { AnalyzeSpendingParams } from '@/services/ai';

type AiSpendingAnalysisProps = {
  params: AnalyzeSpendingParams;
  analyzeFn: (
    params: AnalyzeSpendingParams,
    onChunk: (text: string) => void
  ) => Promise<void>;
};

export function AiSpendingAnalysis({ params, analyzeFn }: AiSpendingAnalysisProps) {
  const [content, setContent] = useState('');
  const streamingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async () => {
      setContent('');
      streamingRef.current = true;
      await analyzeFn(params, (chunk) => {
        setContent((prev) => prev + chunk);
      });
      streamingRef.current = false;
    },
  });

  const isStreaming = streamingRef.current && mutation.isPending;

  if (!mutation.isPending && !mutation.isSuccess && !mutation.isError) {
    return (
      <Button
        data-testid="ai-analyze-btn"
        variant="outline"
        size="sm"
        onClick={() => mutation.mutate()}
        className="gap-1.5"
      >
        <Sparkles size={14} />
        AI 분석
      </Button>
    );
  }

  if (mutation.isPending && !isStreaming) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="ai-analysis-loading">
        <Loader2 size={14} className="animate-spin" />
        분석 중...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(isStreaming || mutation.isSuccess) && content && (
        <div
          data-testid="ai-analysis-content"
          className="rounded-xl border bg-card p-4 text-sm leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none"
        >
          <Markdown>{content}</Markdown>
        </div>
      )}

      {mutation.isError && (
        <p className="text-xs text-destructive">
          {mutation.error.message || '분석에 실패했습니다'}
        </p>
      )}

      {(mutation.isSuccess || mutation.isError) && (
        <Button
          data-testid="ai-analyze-retry"
          variant="ghost"
          size="sm"
          onClick={() => mutation.mutate()}
          className="gap-1.5"
        >
          <RefreshCw size={14} />
          다시 분석
        </Button>
      )}
    </div>
  );
}
