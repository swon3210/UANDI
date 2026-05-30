import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AssetAllocationEditor, type AssetAllocationValue } from './AssetAllocationEditor';

const meta: Meta<typeof AssetAllocationEditor> = {
  title: 'Outer/AssetAllocationEditor',
  component: AssetAllocationEditor,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof AssetAllocationEditor>;

function Wrapper({ initial, isSaving }: { initial: AssetAllocationValue; isSaving?: boolean }) {
  const [value, setValue] = useState<AssetAllocationValue>(initial);
  const [saved, setSaved] = useState<AssetAllocationValue | null>(null);
  return (
    <div className="mx-auto max-w-md space-y-4">
      <AssetAllocationEditor
        value={value}
        onChange={setValue}
        isSaving={isSaving}
        onSave={() => setSaved(value)}
      />
      {saved && (
        <p className="text-xs text-muted-foreground">
          저장됨: 예적금 {saved.savings}% / 주식 {saved.stocks}% / 부동산 {saved.realEstate}% / 코인{' '}
          {saved.crypto}% / 외환 {saved.forex}%
        </p>
      )}
    </div>
  );
}

// 기본 상태 — 합계 100%
export const Default: Story = {
  render: () => (
    <Wrapper initial={{ savings: 30, stocks: 30, realEstate: 25, crypto: 5, forex: 10 }} />
  ),
};

// 합계가 100%가 아니라 저장 불가
export const InvalidTotal: Story = {
  render: () => (
    <Wrapper initial={{ savings: 30, stocks: 30, realEstate: 30, crypto: 5, forex: 10 }} />
  ),
};

// 한 항목에 몰빵 (엣지 케이스)
export const AllStocks: Story = {
  render: () => (
    <Wrapper initial={{ savings: 0, stocks: 100, realEstate: 0, crypto: 0, forex: 0 }} />
  ),
};

// 저장 중 (버튼 비활성 + 라벨 변경)
export const Saving: Story = {
  render: () => (
    <Wrapper initial={{ savings: 30, stocks: 30, realEstate: 25, crypto: 5, forex: 10 }} isSaving />
  ),
};

// onSave 없이 — 읽기/편집만 (저장 버튼 미노출)
export const WithoutSaveButton: Story = {
  render: function NoSave() {
    const [value, setValue] = useState<AssetAllocationValue>({
      savings: 30,
      stocks: 30,
      realEstate: 25,
      crypto: 5,
      forex: 10,
    });
    return (
      <div className="mx-auto max-w-md">
        <AssetAllocationEditor value={value} onChange={setValue} />
      </div>
    );
  },
};
