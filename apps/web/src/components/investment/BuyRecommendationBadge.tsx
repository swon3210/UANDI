import { Badge, cn } from '@uandi/ui';
import { RECOMMENDATION_LABEL, type ForexRecommendation } from '@uandi/investment-core';

type Props = {
  recommendation: ForexRecommendation;
  className?: string;
};

const VARIANT_CLASS: Record<ForexRecommendation, string> = {
  buy: 'bg-sage-100 text-sage-700 border-sage-200 hover:bg-sage-100',
  sell: 'bg-coral-100 text-coral-700 border-coral-200 hover:bg-coral-100',
  hold: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
};

export function BuyRecommendationBadge({ recommendation, className }: Props) {
  return (
    <Badge
      data-testid={`recommendation-${recommendation}`}
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASS[recommendation],
        className
      )}
    >
      {RECOMMENDATION_LABEL[recommendation]}
    </Badge>
  );
}
