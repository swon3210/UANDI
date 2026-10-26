import { Badge } from '@uandi/ui';
import type { StockHoldingInput } from '@/types';
import { formatCurrency } from '@/utils/currency';
import type { StockValuation } from '@/utils/stock-portfolio';
import { ProfitText } from './ProfitText';

type StockHoldingCardProps = {
  holding: StockHoldingInput;
  valuation: StockValuation;
  /** 배당 예정일 표시 문구 (예: "11/15") */
  dividendDateLabel?: string | null;
  onClick?: () => void;
};

function formatPrice(value: number, currency: 'KRW' | 'USD'): string {
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return formatCurrency(value);
}

export function StockHoldingCard({
  holding,
  valuation,
  dividendDateLabel,
  onClick,
}: StockHoldingCardProps) {
  const { quote } = valuation;

  return (
    <button
      type="button"
      data-testid="stock-holding-card"
      onClick={onClick}
      className="block w-full rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 truncate text-base font-semibold">{holding.name}</p>
        {holding.symbol && (
          <span className="shrink-0 text-xs text-muted-foreground">{holding.symbol}</span>
        )}
        {holding.market === 'US' && (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            US
          </Badge>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
          {holding.quantity.toLocaleString('ko-KR')}주
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-xs text-muted-foreground tabular-nums">
          <p>
            현재가{' '}
            <span className="font-medium text-foreground" data-testid="stock-holding-price">
              {quote ? formatPrice(quote.price, holding.currency) : '시세 없음'}
            </span>
          </p>
          <p>평단 {formatPrice(holding.averagePrice, holding.currency)}</p>
        </div>
        <div className="text-right">
          {valuation.profitKrw !== null ? (
            <ProfitText
              value={valuation.profitKrw}
              rate={valuation.profitRate}
              className="text-sm font-semibold"
              data-testid="stock-holding-profit"
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {holding.symbol ? '시세를 불러오지 못했어요' : '종목코드를 입력하면 손익이 보여요'}
            </span>
          )}
          {valuation.valueKrw !== null && (
            <p className="text-xs text-muted-foreground tabular-nums">
              평가 {formatCurrency(valuation.valueKrw)}
            </p>
          )}
        </div>
      </div>

      {(valuation.nextDividendKrw !== null || valuation.annualDividendKrw !== null) && (
        <p data-testid="stock-holding-dividend" className="mt-2 text-xs text-muted-foreground">
          {valuation.nextDividendKrw !== null
            ? `배당 예정${dividendDateLabel ? ` ${dividendDateLabel}` : ''} · ${formatCurrency(valuation.nextDividendKrw)} (세전)`
            : `최근 1년 배당 기준 연 ${formatCurrency(valuation.annualDividendKrw ?? 0)} (세전)`}
        </p>
      )}
    </button>
  );
}
