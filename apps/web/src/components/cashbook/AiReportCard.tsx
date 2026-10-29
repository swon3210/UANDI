'use client';

import type { ComponentProps } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from '@uandi/ui';

export type AiReportStatus =
  /** 첫 청크 전 */
  | 'loading'
  /** 청크가 들어오는 중 */
  | 'streaming'
  | 'success'
  | 'error';

type Props = {
  /** 지금까지 받은 마크다운 */
  content: string;
  status: AiReportStatus;
  errorMessage?: string;
  onRetry: () => void;
  /** 카드 제목 (기본: AI 분석) */
  title?: string;
};

// 마크다운 요소 스타일 (typography 플러그인 없이 최소한만). 대시보드 AI 요약도 같이 쓴다
export const MARKDOWN_COMPONENTS: ComponentProps<typeof Markdown>['components'] = {
  h2: ({ children }) => <h4 className="mb-1 mt-4 text-sm font-semibold first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h5>,
  p: ({ children }) => <p className="mb-1.5 text-sm text-foreground/90">{children}</p>,
  ul: ({ children }) => <ul className="mb-1.5 list-disc space-y-0.5 pl-4 text-sm">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-1.5 list-decimal space-y-0.5 pl-4 text-sm">{children}</ol>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
};

/** 스트리밍 AI 보고서 카드: 로딩 → 점진 표시 → 완료/실패 + 다시 분석 */
export function AiReportCard({ content, status, errorMessage, onRetry, title = 'AI 분석' }: Props) {
  const showContent = content.length > 0 && status !== 'loading';
  const isBusy = status === 'loading' || status === 'streaming';

  return (
    <section data-testid="ai-report-card" className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={14} className="text-primary" />
          {title}
        </h3>
        {!isBusy ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            data-testid="category-analysis-retry"
            className="h-7 gap-1 px-2 text-xs"
          >
            <RefreshCw size={12} />
            다시 분석
          </Button>
        ) : null}
      </div>

      {status === 'loading' ? (
        <div
          data-testid="category-analysis-loading"
          className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
        >
          <Loader2 size={14} className="animate-spin" />
          분석 중이에요...
        </div>
      ) : null}

      {showContent ? (
        <div
          data-testid="category-analysis-report"
          className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed"
        >
          <Markdown components={MARKDOWN_COMPONENTS}>{content}</Markdown>
          {status === 'streaming' ? (
            <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-muted-foreground align-middle" />
          ) : null}
        </div>
      ) : null}

      {status === 'error' ? (
        <p data-testid="category-analysis-error" className="text-xs text-destructive">
          {errorMessage || '분석에 실패했어요. 다시 시도해 주세요'}
        </p>
      ) : null}
    </section>
  );
}
