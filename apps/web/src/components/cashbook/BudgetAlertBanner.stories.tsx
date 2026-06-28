import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BudgetAlertBanner, type BudgetAlert } from './BudgetAlertBanner';

const meta: Meta<typeof BudgetAlertBanner> = {
  title: 'Cashbook/BudgetAlertBanner',
  component: BudgetAlertBanner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BudgetAlertBanner>;

const noop = () => {};

const totalOver100: BudgetAlert = {
  key: 'total-over100',
  scope: 'total',
  label: '전체',
  threshold: 'over100',
};
const totalOver120: BudgetAlert = {
  key: 'total-over120',
  scope: 'total',
  label: '전체',
  threshold: 'over120',
};
function catOver(label: string, threshold: 'over100' | 'over120'): BudgetAlert {
  return { key: `cat-${label}-${threshold}`, scope: 'category', label, threshold };
}

/** 전체 지출 초과 + 카테고리 1개 초과 (식비 단독 예산 같은 경우) */
export const TotalAndCategory: Story = {
  args: {
    alerts: [totalOver100, catOver('식비', 'over100')],
    onDismissAll: noop,
  },
};

/** 전체 예산은 여유 있지만 특정 카테고리만 초과 → 카테고리 카운트 + 링크만 */
export const CategoryOnly: Story = {
  args: {
    alerts: [catOver('식비', 'over120'), catOver('데이트', 'over100')],
    onDismissAll: noop,
  },
};

/** 위험 단계(120% 이상 초과) — 진한 배경 */
export const Danger: Story = {
  args: {
    alerts: [totalOver120, catOver('식비', 'over120'), catOver('소모품', 'over100')],
    onDismissAll: noop,
  },
};

/** 여러 카테고리 초과 — 벽이 아니라 카운트 한 줄로 요약 */
export const ManyCategories: Story = {
  args: {
    alerts: [
      totalOver100,
      catOver('식비', 'over100'),
      catOver('데이트', 'over100'),
      catOver('소모품', 'over100'),
      catOver('병원/건강', 'over120'),
      catOver('공과금', 'over120'),
      catOver('서비스 구독', 'over120'),
      catOver('뷰티/꾸미기', 'over100'),
    ],
    onDismissAll: noop,
  },
};

/** 80% 임박(warn80)만 있으면 상시 배너는 렌더되지 않는다 (월간 게이지가 담당) */
export const OnlyWarn80Hidden: Story = {
  args: {
    alerts: [
      { key: 'cat-식비-warn80', scope: 'category', label: '식비', threshold: 'warn80' },
      { key: 'total-warn80', scope: 'total', label: '전체', threshold: 'warn80' },
    ],
    onDismissAll: noop,
  },
};

function InteractiveDemo() {
  const initial: BudgetAlert[] = [
    totalOver100,
    catOver('식비', 'over120'),
    catOver('데이트', 'over100'),
  ];
  const [alerts, setAlerts] = useState<BudgetAlert[]>(initial);
  return <BudgetAlertBanner alerts={alerts} onDismissAll={() => setAlerts([])} />;
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
