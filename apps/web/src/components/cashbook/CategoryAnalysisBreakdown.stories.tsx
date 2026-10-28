import type { Meta, StoryObj } from '@storybook/react';
import { CategoryAnalysisBreakdown } from './CategoryAnalysisBreakdown';

const meta: Meta<typeof CategoryAnalysisBreakdown> = {
  title: 'Cashbook/CategoryAnalysisBreakdown',
  component: CategoryAnalysisBreakdown,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    group: 'expense',
    compareLabel: '평소',
    rows: [
      { category: '여행', color: '#5B8DEF', current: 3_533_000, compare: 200_000 },
      { category: '식비', color: '#F2994A', current: 1_100_000, compare: 1_500_000 },
      { category: '데이트', color: '#EB5757', current: 60_000, compare: 0 },
      { category: '월세', color: '#9B51E0', current: 0, compare: 700_000 },
      { category: '교통', color: '#2D9CDB', current: 120_000, compare: 120_000 },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof CategoryAnalysisBreakdown>;

/** 늘어난·줄어든·새로 생긴·이번 달 없는·같은 카테고리가 섞인 경우 */
export const VsMedian: Story = {};

export const VsMonth: Story = {
  args: { compareLabel: '9월' },
};

export const Income: Story = {
  args: {
    group: 'income',
    rows: [
      { category: '정기급여', color: '#27AE60', current: 3_200_000, compare: 3_200_000 },
      { category: '상여', color: '#6FCF97', current: 0, compare: 500_000 },
    ],
  },
};

/** 평소 표본이 부족해 비교 금액이 없는 경우 */
export const NoCompare: Story = {
  args: {
    rows: [
      { category: '식비', color: '#F2994A', current: 420_000, compare: null },
      { category: '교통', color: '#2D9CDB', current: 160_000, compare: null },
    ],
  },
};

export const LongName: Story = {
  args: {
    rows: [
      {
        category: '아주아주긴카테고리이름입니다정말로',
        color: '#9B9B9B',
        current: 123_456_789,
        compare: 98_765_432,
      },
      { category: '식비', color: '#F2994A', current: 1, compare: 0 },
    ],
  },
};
