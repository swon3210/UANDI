'use client';

import { useState } from 'react';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, Sheet } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { useOuterAssetMutations, useOuterAssets, useStockQuotes } from '@/hooks/useOuterAssets';
import { parseStockHoldingsScreenshot } from '@/services/investment-api';
import { toAssetInput } from '@/services/outer-assets';
import { compressAndEncode } from '@/utils/image-compress';
import { quoteKey, summarizePortfolio, valuateHolding } from '@/utils/stock-portfolio';
import type { StockHolding } from '@/types';
import { PortfolioSummaryCard } from './PortfolioSummaryCard';
import { ScreenshotPickButton } from './ScreenshotPickButton';
import { StockHoldingCard } from './StockHoldingCard';
import { StockHoldingForm } from './StockHoldingForm';
import { StockImportSheet } from './StockImportSheet';

type StocksTabProps = {
  coupleId: string;
  uid: string;
};

export function StocksTab({ coupleId, uid }: StocksTabProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { data: holdings, isLoading } = useOuterAssets(coupleId, uid, 'stockHoldings');
  const { add, update, remove } = useOuterAssetMutations(coupleId, uid, 'stockHoldings');

  const keys = (holdings ?? []).map(quoteKey).filter((k): k is string => k !== null);
  const quotesQuery = useStockQuotes(keys);
  const quotes = quotesQuery.data?.quotes;
  const usdKrw = quotesQuery.data?.usdKrw ?? null;

  const items = (holdings ?? []).map((holding) => ({
    holding,
    valuation: valuateHolding(holding, quotes, usdKrw),
  }));
  const summary = summarizePortfolio(items.map((i) => i.valuation));
  const latestAsOf = Object.values(quotes ?? {})
    .map((q) => q.asOf)
    .sort()
    .at(-1);

  const openForm = (holding?: StockHolding) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <StockHoldingForm
          initial={holding ? toAssetInput<'stockHoldings'>(holding) : undefined}
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

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const { dataUrl } = await compressAndEncode(file);
      const result = await parseStockHoldingsScreenshot(dataUrl);
      if (!result.isHoldingsScreen || result.holdings.length === 0) {
        toast.error('캡처에서 보유 종목을 찾지 못했어요');
        return;
      }
      overlay.open(({ isOpen, close, unmount }) => (
        <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
          <StockImportSheet
            holdings={result.holdings}
            onSave={(items) => add.mutate(items)}
            onClose={() => {
              close();
              setTimeout(unmount, 300);
            }}
          />
        </Sheet>
      ));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '캡처를 분석하지 못했어요');
    } finally {
      setIsImporting(false);
    }
  };

  const actions = (
    <div className="grid grid-cols-2 gap-2">
      <ScreenshotPickButton
        onPick={handleImport}
        isLoading={isImporting}
        data-testid="stock-import-button"
      >
        잔고 캡처로 추가
      </ScreenshotPickButton>
      <Button variant="outline" onClick={() => openForm()} data-testid="stock-add-button">
        <Plus className="h-4 w-4" />
        직접 추가
      </Button>
    </div>
  );

  if (isLoading) return <MascotLoader />;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="보유 주식을 등록해 보세요"
          description="증권사 잔고 화면을 캡처해 올리면 종목·매수가·수량을 한 번에 채워드려요."
        />
        {actions}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PortfolioSummaryCard
        summary={summary}
        isLoading={quotesQuery.isLoading}
        quoteError={quotesQuery.isError}
        asOfLabel={latestAsOf ? `${dayjs(latestAsOf).format('M/D HH:mm')} 시세 기준` : null}
      />
      {actions}
      <div className="space-y-3">
        {items.map(({ holding, valuation }) => (
          <StockHoldingCard
            key={holding.id}
            holding={holding}
            valuation={valuation}
            dividendDateLabel={
              holding.nextDividendDate ? dayjs(holding.nextDividendDate).format('M/D') : null
            }
            onClick={() => openForm(holding)}
          />
        ))}
      </div>
    </div>
  );
}
