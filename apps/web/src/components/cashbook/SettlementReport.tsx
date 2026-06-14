'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, RefreshCw, FileDown, FileText } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from '@uandi/ui';
import { toast } from 'sonner';
import type { AnalyzeSpendingParams } from '@/services/ai';
import {
  downloadMarkdown,
  downloadElementsAsPdf,
  captureElementPngDataUrl,
} from '@/lib/export/report';

export type SettlementChart = {
  /** 차트 제목 (마크다운 이미지 alt 로 사용) */
  title: string;
  /** 캡처할 차트 DOM 노드 getter (렌더 후 시점에 호출) */
  getNode: () => HTMLElement | null;
};

type SettlementReportProps = {
  params: AnalyzeSpendingParams;
  analyzeFn: (params: AnalyzeSpendingParams, onChunk: (text: string) => void) => Promise<void>;
  /** 파일명 접미사 (예: '2026-06') */
  monthLabel: string;
  /** 보고서(PDF·Markdown)에 함께 담을 차트들 */
  charts?: SettlementChart[];
  /** 생성된 분석 마크다운을 상위로 전달(결산 완료 스냅샷에 담기 위함) */
  onContentChange?: (markdown: string) => void;
};

export function SettlementReport({
  params,
  analyzeFn,
  monthLabel,
  charts,
  onContentChange,
}: SettlementReportProps) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      let acc = '';
      setContent('');
      onContentChange?.('');
      setIsStreaming(true);
      await analyzeFn(params, (chunk) => {
        acc += chunk;
        setContent(acc);
        onContentChange?.(acc);
      });
      setIsStreaming(false);
    },
  });

  const resolveChartNodes = (): HTMLElement[] =>
    (charts ?? []).map((c) => c.getNode()).filter((n): n is HTMLElement => n != null);

  const handlePdfDownload = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      // 차트 먼저, 그 뒤에 보고서 텍스트 순서로 한 PDF에 담는다
      await downloadElementsAsPdf(
        [...resolveChartNodes(), reportRef.current],
        `settlement-${monthLabel}.pdf`
      );
    } catch {
      toast.error('PDF 저장에 실패했습니다');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkdownDownload = async () => {
    setIsExporting(true);
    try {
      // 차트를 base64 PNG 로 임베드해 차트가 포함된 자기완결적 마크다운을 만든다.
      // 개별 차트 캡처가 실패해도 텍스트 보고서는 항상 내려받도록 차트별로 무시한다.
      const imageBlocks: string[] = [];
      for (const chart of charts ?? []) {
        const node = chart.getNode();
        if (!node) continue;
        try {
          const dataUrl = await captureElementPngDataUrl(node);
          imageBlocks.push(`### ${chart.title}\n\n![${chart.title}](${dataUrl})`);
        } catch {
          // 이 차트만 건너뜀
        }
      }

      const header = `# 월 점검 보고서 (${monthLabel})`;
      const charts_md = imageBlocks.length > 0 ? `\n\n## 차트\n\n${imageBlocks.join('\n\n')}` : '';
      const body = `\n\n## 분석\n\n${content}`;
      downloadMarkdown(`settlement-${monthLabel}.md`, `${header}${charts_md}${body}\n`);
    } finally {
      setIsExporting(false);
    }
  };

  // 초기 상태 — 분석 버튼만
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
        AI 점검 보고서
      </Button>
    );
  }

  // 스트리밍 시작 전 로딩
  if (mutation.isPending && !isStreaming) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground"
        data-testid="ai-analysis-loading"
      >
        <Loader2 size={14} className="animate-spin" />
        보고서 작성 중...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(isStreaming || mutation.isSuccess) && content && (
        <div
          ref={reportRef}
          data-testid="ai-analysis-content"
          className="rounded-xl border bg-card p-4 text-sm leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none"
        >
          <Markdown>{content}</Markdown>
        </div>
      )}

      {mutation.isError && (
        <p className="text-xs text-destructive">{mutation.error.message || '분석에 실패했습니다'}</p>
      )}

      {(mutation.isSuccess || mutation.isError) && (
        <div className="flex flex-wrap items-center gap-1.5">
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

          {mutation.isSuccess && content && (
            <>
              <Button
                data-testid="settlement-md-download"
                variant="ghost"
                size="sm"
                onClick={handleMarkdownDownload}
                disabled={isExporting}
                className="gap-1.5"
              >
                <FileText size={14} />
                Markdown
              </Button>
              <Button
                data-testid="settlement-pdf-download"
                variant="ghost"
                size="sm"
                onClick={handlePdfDownload}
                disabled={isExporting}
                className="gap-1.5"
              >
                {isExporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileDown size={14} />
                )}
                PDF
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
