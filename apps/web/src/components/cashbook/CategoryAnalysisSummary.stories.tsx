import type { Meta, StoryObj } from '@storybook/react';
import { CategoryAnalysisSummary } from './CategoryAnalysisSummary';

const meta: Meta<typeof CategoryAnalysisSummary> = {
  title: 'Cashbook/CategoryAnalysisSummary',
  component: CategoryAnalysisSummary,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    title: '선택한 카테고리 3개',
    categories: [
      { name: '여행', color: '#5B8DEF' },
      { name: '식비', color: '#F2994A' },
      { name: '데이트', color: '#EB5757' },
    ],
    group: 'expense',
    monthLabel: '2026년 10월',
    currentAmount: 4_693_000,
    compareLabel: '평소',
    compareHint: '최근 5개월 중위값',
    compareAmount: 1_650_000,
    unavailableMessage: '지난달 기록이 2개월 이상 쌓이면 평소와 비교해 드려요',
  },
};
export default meta;

type Story = StoryObj<typeof CategoryAnalysisSummary>;

/** 고른 카테고리 묶음을 평소와 비교 */
export const SelectedVsMedian: Story = {};

/** 기간 비교에서 특정 달(전월)과 비교하던 경우 */
export const SelectedVsPrevMonth: Story = {
  args: { compareLabel: '2026년 9월', compareHint: '전월', compareAmount: 5_200_000 },
};

/** 카테고리를 고르지 않아 범위 전체를 분석 (칩 없음) */
export const WholeScope: Story = {
  args: { title: '전체 변동 지출', categories: [] },
};

export const Income: Story = {
  args: {
    title: '상여',
    categories: [{ name: '상여', color: '#27AE60' }],
    group: 'income',
    currentAmount: 0,
    compareAmount: 500_000,
  },
};

/** 지난달 기록이 부족해 평소 금액이 없는 경우 */
export const NoMedian: Story = {
  args: { compareHint: undefined, compareAmount: null },
};

export const ManyLongNames: Story = {
  args: {
    title: '선택한 카테고리 6개',
    categories: [
      '아주아주긴카테고리이름입니다정말로',
      '식비',
      '교통',
      '구독 서비스',
      '경조사',
      '반려동물',
    ].map((name) => ({ name, color: '#9B9B9B' })),
    currentAmount: 123_456_789,
  },
};
