'use client';

import Link from 'next/link';
import { ChevronRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from '@uandi/ui';
import { MARKDOWN_COMPONENTS, type AiReportStatus } from '@/components/cashbook/AiReportCard';

type Props = {
  /** 요약 대상 범위 (예: 선택한 카테고리 3개, 전체 변동 지출) */
  scopeTitle: string;
  /** AI 리포트의 요약 섹션 본문 (마크다운, 스트리밍 중이면 받은 데까지) */
  content: string;
  status: AiReportStatus;
  errorMessage?: string;
  onRetry: () => void;
  /** 전체 리포트(분석 페이지) 링크 */
  href: string;
};

/**
 * 기간 비교 아래 AI 요약 카드: 비교 중인 범위 리포트의 요약 섹션만 보여주고,
 * 나머지는 "전체 리포트 보기"로 분석 페이지에서 본다 (같은 리포트를 캐시로 공유).
 */
export function CompareAiSummary({
  scopeTitle,
  content,
  status,
  errorMessage,
  onRetry,
  href,
}: Props) {
  const isWaiting = status === 'loading' || (status === 'streaming' && content.length === 0);

  return (
    <section data-testid="compare-ai-summary-card" className="space-y-3">
      <h3 className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles size={14} className="shrink-0 text-primary" />
        <span className="shrink-0 font-semibold text-foreground">AI 요약</span>
        <span className="truncate">· {scopeTitle}</span>
      </h3>

      {status === 'error' ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-destructive">
            {errorMessage || '요약을 만들지 못했어요. 다시 시도해 주세요'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            data-testid="compare-ai-summary-retry"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
          >
            <RefreshCw size={12} />
            다시 시도
          </Button>
        </div>
      ) : isWaiting ? (
        <p
          data-testid="compare-ai-summary-loading"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 size={14} className="animate-spin" />
          요약하는 중이에요...
        </p>
      ) : (
        <div data-testid="compare-ai-summary" className="text-sm leading-relaxed">
          <Markdown components={MARKDOWN_COMPONENTS}>{content}</Markdown>
          {status === 'streaming' ? (
            <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-muted-foreground align-middle" />
          ) : null}
        </div>
      )}

      <Button asChild variant="outline" size="sm" className="w-full gap-1">
        <Link href={href} data-testid="compare-ai-analysis">
          전체 리포트 보기
          <ChevronRight size={14} />
        </Link>
      </Button>
    </section>
  );
}
