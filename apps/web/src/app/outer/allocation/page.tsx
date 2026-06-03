'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { AssetAllocationEditor, type AssetAllocationValue, FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { PageHeader } from '@/components/shell/PageHeader';
import { useAssetAllocation, useUpdateAssetAllocation } from '@/hooks/useAssetAllocation';
import { AssetProjectionPanel } from '@/components/outer/AssetProjectionPanel';
import { DEFAULT_ASSET_ALLOCATION } from '@/types';

type AllocationFormProps = {
  initial: AssetAllocationValue;
  isSaving: boolean;
  onSave: (value: AssetAllocationValue) => void;
};

function AllocationForm({ initial, isSaving, onSave }: AllocationFormProps) {
  // 비율은 에디터와 미래 자산 추이 패널이 함께 공유한다 (슬라이더 조정이 그래프에 즉시 반영)
  const [value, setValue] = useState<AssetAllocationValue>(initial);

  return (
    <div className="space-y-8">
      <AssetProjectionPanel ratio={value} />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          예적금·주식·부동산·코인·외환에 자산을 어떤 비율로 나눌지 목표를 정해 보세요. 모든 항목의
          합이 100%가 되어야 저장할 수 있어요.
        </p>
        <AssetAllocationEditor
          value={value}
          onChange={setValue}
          isSaving={isSaving}
          onSave={() => onSave(value)}
        />
      </div>
    </div>
  );
}

export default function OuterAllocationPage() {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? null;

  const { data, isLoading } = useAssetAllocation(coupleId, uid);
  const updateMutation = useUpdateAssetAllocation(coupleId, uid);

  // 구버전(현금/예적금/투자) 문서가 남아 있을 수 있어 누락 필드는 기본값으로 보정한다
  const initial: AssetAllocationValue = data
    ? {
        savings: data.savings ?? DEFAULT_ASSET_ALLOCATION.savings,
        stocks: data.stocks ?? DEFAULT_ASSET_ALLOCATION.stocks,
        realEstate: data.realEstate ?? DEFAULT_ASSET_ALLOCATION.realEstate,
        crypto: data.crypto ?? DEFAULT_ASSET_ALLOCATION.crypto,
        forex: data.forex ?? DEFAULT_ASSET_ALLOCATION.forex,
      }
    : DEFAULT_ASSET_ALLOCATION;

  return (
    <>
      <PageHeader data-testid="outer-allocation-header" title="자산 배분" />
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        {isLoading || !uid || !coupleId ? (
          <FullScreenSpinner />
        ) : (
          <AllocationForm
            // 저장된 값이 로드된 뒤 그 값으로 폼을 초기화 (useEffect 동기화 대신 key 리셋)
            key={data ? 'loaded' : 'default'}
            initial={initial}
            isSaving={updateMutation.isPending}
            onSave={(value) => updateMutation.mutate(value)}
          />
        )}
      </main>
    </>
  );
}
