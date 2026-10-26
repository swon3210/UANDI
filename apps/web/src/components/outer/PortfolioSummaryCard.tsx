import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import type { PortfolioSummary } from '@/utils/stock-portfolio';
import { ProfitText } from './ProfitText';

type PortfolioSummaryCardProps = {
  summary: PortfolioSummary;
  /** 시세 기준 시각 표시 문구 (예: "10/26 15:30 기준") */
  asOfLabel?: string | null;
  isLoading?: boolean;
  quoteError?: boolean;
};

export function PortfolioSummaryCard({
  summary,
  asOfLabel,
  isLoading,
  quoteError,
}: PortfolioSummaryCardProps) {
  return (
    <section
      data-testid="portfolio-summary-card"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp size={16} className="text-primary" />
        평가금액
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-40" />
      ) : (
        <p data-testid="portfolio-total-value" className="mt-1 text-2xl font-bold tabular-nums">
          {formatCurrency(summary.totalValueKrw)}
        </p>
      )}
      <div className="mt-1 text-sm font-semibold">
        {isLoading ? (
          <Skeleton className="h-5 w-32" />
        ) : (
          <ProfitText
            value={summary.totalProfitKrw}
            rate={summary.totalProfitRate}
            data-testid="portfolio-total-profit"
          />
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">오늘</dt>
          <dd className="font-medium">
            <ProfitText value={summary.dayChangeKrw} />
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-muted-foreground">예상 배당 (연, 세전)</dt>
          <dd data-testid="portfolio-dividend" className="font-medium tabular-nums">
            {formatCurrency(summary.annualDividendKrw)}
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {quoteError
          ? '시세를 불러오지 못해 매수금액 기준으로 표시하고 있어요'
          : [
              asOfLabel,
              summary.missingQuoteCount > 0 &&
                `시세 없는 종목 ${summary.missingQuoteCount}개는 매수금액으로 계산`,
            ]
              .filter(Boolean)
              .join(' · ') || '장중엔 지연 시세, 마감 후엔 종가 기준'}
      </p>
    </section>
  );
}
