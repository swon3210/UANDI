import { Building2 } from 'lucide-react';
import { Skeleton } from '@uandi/ui';
import type { RealEstateHoldingInput } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatEokMan, type AptTrade } from '@/utils/apt-trades';
import { estimateSupplyPyeong, type CapitalGainsEstimate } from '@/utils/real-estate-tax';
import { ProfitText } from './ProfitText';

type RealEstateCardProps = {
  holding: RealEstateHoldingInput;
  /** 현재 시세 (원). 실거래·수동 모두 없으면 null */
  marketPrice: number | null;
  priceSource: 'trade' | 'manual' | null;
  /** 시세 산출에 쓴 최근 거래 */
  latestTrade?: AptTrade | null;
  propertyTax: number | null;
  capitalGains: CapitalGainsEstimate | null;
  isLoading?: boolean;
  onClick?: () => void;
};

export function RealEstateCard({
  holding,
  marketPrice,
  priceSource,
  latestTrade,
  propertyTax,
  capitalGains,
  isLoading,
  onClick,
}: RealEstateCardProps) {
  const profit = marketPrice !== null ? marketPrice - holding.purchasePrice : null;
  const regionShort = holding.regionName.split(' ').slice(1).join(' ') || holding.regionName;

  return (
    <button
      type="button"
      data-testid="real-estate-card"
      onClick={onClick}
      className="block w-full rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{holding.aptName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[regionShort, holding.dong].filter(Boolean).join(' ')} · 전용 {holding.exclusiveArea}㎡
            (약 {estimateSupplyPyeong(holding.exclusiveArea)}평형)
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            {priceSource === 'manual' ? '수동 입력 시세' : '실거래 시세'}
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-28" />
          ) : (
            <p data-testid="real-estate-market-price" className="text-lg font-bold tabular-nums">
              {marketPrice !== null ? formatEokMan(marketPrice) : '시세 없음'}
            </p>
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            매수 {formatEokMan(holding.purchasePrice)}
          </p>
        </div>
        {profit !== null && !isLoading && (
          <ProfitText
            value={profit}
            rate={holding.purchasePrice > 0 ? profit / holding.purchasePrice : null}
            className="text-sm font-semibold"
            data-testid="real-estate-profit"
          />
        )}
      </div>

      {latestTrade && priceSource === 'trade' && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          최근 거래 {latestTrade.date}
          {latestTrade.floor !== null && ` · ${latestTrade.floor}층`} ·{' '}
          {formatEokMan(latestTrade.price)}
        </p>
      )}

      {marketPrice !== null && !isLoading && (
        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">재산세 (연)</dt>
            <dd data-testid="real-estate-property-tax" className="tabular-nums">
              {formatCurrency(propertyTax ?? 0)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">양도세 (지금 매도 시)</dt>
            <dd data-testid="real-estate-capital-gains-tax" className="tabular-nums">
              {capitalGains?.isExempt
                ? '0원 (1주택 비과세)'
                : formatCurrency(capitalGains?.tax ?? 0)}
            </dd>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">
            공시가격 추정·단순화한 세율로 계산한 참고용 추정치예요.
          </p>
        </dl>
      )}
    </button>
  );
}
