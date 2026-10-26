import { cn } from '@uandi/ui';
import { formatSignedPercent, formatSignedWon } from '@/utils/stock-portfolio';

type ProfitTextProps = {
  value: number;
  rate?: number | null;
  className?: string;
  'data-testid'?: string;
};

/** 손익 금액(+수익률). 국내 증권 관례대로 상승은 빨강, 하락은 파랑. */
export function ProfitText({ value, rate, className, 'data-testid': testId }: ProfitTextProps) {
  const rounded = Math.round(value);
  return (
    <span
      data-testid={testId}
      className={cn(
        'tabular-nums',
        rounded > 0 && 'text-destructive',
        rounded < 0 && 'text-blue-500',
        rounded === 0 && 'text-muted-foreground',
        className
      )}
    >
      {formatSignedWon(rounded)}
      {rate !== undefined && rate !== null && ` (${formatSignedPercent(rate)})`}
    </span>
  );
}
