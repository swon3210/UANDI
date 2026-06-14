'use client';

import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import Markdown from 'react-markdown';
import { CheckCircle2, RefreshCw, FileDown, FileText, Loader2, ImageDown } from 'lucide-react';
import {
  Button,
  BudgetVsActualChart,
  IncomeExpensePieChart,
  DailyCumulativeChart,
} from '@uandi/ui';
import { toast } from 'sonner';
import type { SettlementReportSnapshot } from '@/types';
import {
  downloadMarkdown,
  downloadElementsAsPdf,
  downloadElementAsPng,
  captureElementPngDataUrl,
} from '@/lib/export/report';
import { SettlementSummaryHeader } from './SettlementSummaryHeader';

export type SettlementReportViewProps = {
  report: SettlementReportSnapshot;
  /** 'YYYY-MM' — 파일명/제목 접미사 */
  monthLabel: string;
  onRedo: () => void;
  isRedoing?: boolean;
};

/**
 * 완료된 결산의 박제 보고서 뷰. report 스냅샷만으로 차트를 재렌더한다(내역 재쿼리 없음).
 * "다시 결산하기"로 draft 워크스페이스로 되돌릴 수 있다.
 */
export function SettlementReportView({
  report,
  monthLabel,
  onRedo,
  isRedoing,
}: SettlementReportViewProps) {
  const budgetChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const dailyChartRef = useRef<HTMLDivElement>(null);
  const reportTextRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const hasBudget = report.barData.length > 0;
  const hasPie = report.pieData.length > 0;
  const hasDaily = report.dailyData.length > 0;

  const chartNodes = (): HTMLElement[] =>
    [budgetChartRef.current, pieChartRef.current, dailyChartRef.current].filter(
      (n): n is HTMLDivElement => n != null
    );

  const handlePng = async (node: HTMLElement | null, name: string) => {
    if (!node) return;
    setExporting(true);
    try {
      await downloadElementAsPng(node, `settlement-${name}-${monthLabel}.png`);
    } catch {
      toast.error('이미지 저장에 실패했습니다');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = async () => {
    setExporting(true);
    try {
      const nodes = [...chartNodes()];
      if (reportTextRef.current) nodes.push(reportTextRef.current);
      await downloadElementsAsPdf(nodes, `settlement-${monthLabel}.pdf`);
    } catch {
      toast.error('PDF 저장에 실패했습니다');
    } finally {
      setExporting(false);
    }
  };

  const handleMarkdown = async () => {
    setExporting(true);
    try {
      const imageBlocks: string[] = [];
      const charts: { title: string; node: HTMLElement | null }[] = [
        { title: '카테고리별 예산 vs 실적', node: budgetChartRef.current },
        { title: '수입 · 지출 · FLEX 구성', node: pieChartRef.current },
        { title: '일별 누적 지출', node: dailyChartRef.current },
      ];
      for (const chart of charts) {
        if (!chart.node) continue;
        try {
          const dataUrl = await captureElementPngDataUrl(chart.node);
          imageBlocks.push(`### ${chart.title}\n\n![${chart.title}](${dataUrl})`);
        } catch {
          /* 이 차트만 건너뜀 */
        }
      }
      const header = `# 월 점검 보고서 (${monthLabel})`;
      const chartsMd = imageBlocks.length > 0 ? `\n\n## 차트\n\n${imageBlocks.join('\n\n')}` : '';
      const body = report.aiAnalysis ? `\n\n## 분석\n\n${report.aiAnalysis}` : '';
      downloadMarkdown(`settlement-${monthLabel}.md`, `${header}${chartsMd}${body}\n`);
    } finally {
      setExporting(false);
    }
  };

  const pngButton = (key: string, name: string, node: () => HTMLElement | null) => (
    <Button
      data-testid={`settlement-png-download-${key}`}
      variant="ghost"
      size="sm"
      onClick={() => handlePng(node(), name)}
      disabled={exporting}
      className="h-7 gap-1 px-2 text-xs text-muted-foreground"
    >
      <ImageDown size={13} />
      PNG
    </Button>
  );

  return (
    <div className="space-y-6" data-testid="settlement-report-view">
      {/* 완료 배지 */}
      <div className="flex items-center justify-between rounded-xl border border-income/30 bg-income/5 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium text-income">
          <CheckCircle2 size={16} />
          점검 완료
        </span>
        <span className="text-xs text-muted-foreground">
          {dayjs(report.completedAt.toDate()).format('YYYY.MM.DD HH:mm')}
        </span>
      </div>

      <SettlementSummaryHeader
        income={report.totals.income}
        expense={report.totals.expense}
        flex={report.totals.flex}
      />

      {/* 차트 */}
      {hasBudget && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">카테고리별 예산 vs 실적</h2>
            {pngButton('budget', 'budget', () => budgetChartRef.current)}
          </div>
          <div ref={budgetChartRef} className="rounded-xl bg-card p-2">
            <BudgetVsActualChart data={report.barData} />
          </div>
        </div>
      )}

      {hasPie && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">수입 · 지출 · FLEX 구성</h2>
            {pngButton('pie', 'income-expense', () => pieChartRef.current)}
          </div>
          <div ref={pieChartRef} className="rounded-xl bg-card p-2">
            <IncomeExpensePieChart data={report.pieData} />
          </div>
        </div>
      )}

      {hasDaily && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">일별 누적 지출</h2>
            {pngButton('daily', 'daily', () => dailyChartRef.current)}
          </div>
          <div ref={dailyChartRef} className="rounded-xl bg-card p-2">
            <DailyCumulativeChart data={report.dailyData} budgetCeiling={report.budgetCeiling} />
          </div>
        </div>
      )}

      {/* AI 분석 */}
      {report.aiAnalysis && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">AI 점검 보고서</h2>
          <div
            ref={reportTextRef}
            data-testid="settlement-report-ai"
            className="prose prose-sm prose-neutral max-w-none rounded-xl border bg-card p-4 text-sm leading-relaxed dark:prose-invert"
          >
            <Markdown>{report.aiAnalysis}</Markdown>
          </div>
        </div>
      )}

      {/* 내보내기 + 다시 점검하기 */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
        <Button
          data-testid="settlement-md-download"
          variant="ghost"
          size="sm"
          onClick={handleMarkdown}
          disabled={exporting}
          className="gap-1.5"
        >
          <FileText size={14} />
          Markdown
        </Button>
        <Button
          data-testid="settlement-pdf-download"
          variant="ghost"
          size="sm"
          onClick={handlePdf}
          disabled={exporting}
          className="gap-1.5"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          PDF
        </Button>
        <Button
          data-testid="settlement-redo-btn"
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={isRedoing}
          className="ml-auto gap-1.5"
        >
          {isRedoing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          다시 점검하기
        </Button>
      </div>
    </div>
  );
}
