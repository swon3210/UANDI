'use client';

import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Building2, Plus } from 'lucide-react';
import { Button, EmptyState, Sheet } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { useAptTrades, useOuterAssetMutations, useOuterAssets } from '@/hooks/useOuterAssets';
import { fetchAptTrades } from '@/services/investment-api';
import { toAssetInput } from '@/services/outer-assets';
import { estimateMarketPrice } from '@/utils/apt-trades';
import { estimateCapitalGainsTax, estimatePropertyTax } from '@/utils/real-estate-tax';
import type { RealEstateHolding } from '@/types';
import { RealEstateCard } from './RealEstateCard';
import { RealEstateForm } from './RealEstateForm';

type RealEstateTabProps = {
  coupleId: string;
  uid: string;
};

function RealEstateHoldingItem({
  holding,
  onClick,
}: {
  holding: RealEstateHolding;
  onClick: () => void;
}) {
  const tradesQuery = useAptTrades(holding.lawdCd, holding.aptName);
  const market = tradesQuery.data
    ? estimateMarketPrice(tradesQuery.data.trades, holding.exclusiveArea)
    : null;
  const marketPrice = market?.price ?? holding.manualMarketPrice;
  const priceSource = market ? 'trade' : holding.manualMarketPrice !== null ? 'manual' : null;

  return (
    <RealEstateCard
      holding={holding}
      marketPrice={marketPrice}
      priceSource={priceSource}
      latestTrade={market?.latest ?? null}
      isLoading={tradesQuery.isLoading}
      propertyTax={
        marketPrice !== null ? estimatePropertyTax(marketPrice, holding.isSingleHome) : null
      }
      capitalGains={
        marketPrice !== null
          ? estimateCapitalGainsTax({
              purchasePrice: holding.purchasePrice,
              salePrice: marketPrice,
              purchaseDate: holding.purchaseDate,
              isSingleHome: holding.isSingleHome,
            })
          : null
      }
      onClick={onClick}
    />
  );
}

export function RealEstateTab({ coupleId, uid }: RealEstateTabProps) {
  const { data: holdings, isLoading } = useOuterAssets(coupleId, uid, 'realEstateHoldings');
  const { add, update, remove } = useOuterAssetMutations(coupleId, uid, 'realEstateHoldings');

  const openForm = (holding?: RealEstateHolding) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <RealEstateForm
          initial={holding ? toAssetInput<'realEstateHoldings'>(holding) : undefined}
          defaultPurchaseDate={dayjs().format('YYYY-MM-DD')}
          onSearchTrades={async (lawdCd, aptName) => (await fetchAptTrades(lawdCd, aptName)).trades}
          onSubmit={(input) =>
            holding ? update.mutate({ id: holding.id, input }) : add.mutate([input])
          }
          onDelete={holding ? () => remove.mutate(holding.id) : undefined}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const addButton = (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => openForm()}
      data-testid="real-estate-add-button"
    >
      <Plus className="h-4 w-4" />
      아파트 추가
    </Button>
  );

  if (isLoading) return <MascotLoader />;

  if (!holdings || holdings.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Building2 size={48} />}
          title="보유 아파트를 등록해 보세요"
          description="아파트명과 평형을 고르면 국토교통부 실거래가로 시세와 평가손익, 예상 세금을 보여드려요."
        />
        {addButton}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {holdings.map((holding) => (
        <RealEstateHoldingItem
          key={holding.id}
          holding={holding}
          onClick={() => openForm(holding)}
        />
      ))}
      {addButton}
    </div>
  );
}
