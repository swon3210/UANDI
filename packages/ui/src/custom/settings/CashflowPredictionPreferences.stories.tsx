import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CashflowPredictionPreferences } from './CashflowPredictionPreferences';
import { DEFAULT_CASHFLOW_PREDICTION, type CashflowPredictionPrefs } from './aiPreferences';

const CATEGORIES = ['식비', '교통', '외식', '카페', '쇼핑', '문화생활', '부수입'];

const meta: Meta<typeof CashflowPredictionPreferences> = {
  title: 'Settings/AI 맞춤화/B. 현금흐름 예측',
  component: CashflowPredictionPreferences,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "캘린더 'AI 예상 내역' 예측 맞춤화 섹션. 예측 성향(보수/표준/적극) enum + 제외 카테고리는 " +
          '커플 카테고리에서만 선택 → 자유 텍스트 없음(인젝션 표면 0).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowPredictionPreferences>;

function Demo({ initial, categories }: { initial: CashflowPredictionPrefs; categories: string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <CashflowPredictionPreferences value={value} onChange={setValue} categories={categories} />
  );
}

export const Default: Story = {
  name: '기본 (꺼짐)',
  render: () => <Demo initial={DEFAULT_CASHFLOW_PREDICTION} categories={CATEGORIES} />,
};

export const Enabled: Story = {
  name: '켜짐 (표준)',
  render: () => (
    <Demo initial={{ ...DEFAULT_CASHFLOW_PREDICTION, enabled: true }} categories={CATEGORIES} />
  ),
};

export const AggressiveWithExclusions: Story = {
  name: '적극적 + 제외 2개',
  render: () => (
    <Demo
      initial={{ enabled: true, stance: 'aggressive', excludedCategories: ['외식', '카페'] }}
      categories={CATEGORIES}
    />
  ),
};

export const NoCategories: Story = {
  name: '카테고리 없음',
  render: () => (
    <Demo initial={{ ...DEFAULT_CASHFLOW_PREDICTION, enabled: true }} categories={[]} />
  ),
};
