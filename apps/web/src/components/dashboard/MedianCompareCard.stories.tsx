import type { Meta, StoryObj } from '@storybook/react';
import { MedianCompareCard } from './MedianCompareCard';
import type { MedianComparison } from '@/utils/median-comparison';

const meta: Meta<typeof MedianCompareCard> = {
  title: 'Dashboard/MedianCompareCard',
  component: MedianCompareCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: { group: 'expense', hrefOf: (name) => `/inner/cashbook/analysis?category=${name}` },
};
export default meta;

type Story = StoryObj<typeof MedianCompareCard>;

/** 이번 달 지출이 평소보다 훨씬 많고, 많이/적게/없음/새로 네 종류가 모두 섞인 경우 */
export const Overspent: Story = {
  args: {
    comparison: {
      windowMonths: 6,
      sampleMonths: 5,
      total: { current: 7_065_000, median: 2_320_000 },
      highlights: [
        { category: '여행', kind: 'high', current: 3_533_000, median: 200_000 },
        { category: '월세', kind: 'missing', current: 0, median: 700_000 },
        { category: '교통', kind: 'low', current: 146_000, median: 320_000 },
        { category: '데이트', kind: 'new', current: 61_000, median: 0 },
      ],
    } satisfies MedianComparison,
  },
};

/** 평소보다 적게 쓴 달 (좋은 변화 😎) */
export const Underspent: Story = {
  args: {
    comparison: {
      windowMonths: 6,
      sampleMonths: 6,
      total: { current: 1_540_000, median: 2_320_000 },
      highlights: [{ category: '식비', kind: 'low', current: 280_000, median: 620_000 }],
    },
  },
};

/** 평소와 비슷해서 눈에 띄는 카테고리가 없는 경우 */
export const NothingNotable: Story = {
  args: {
    comparison: {
      windowMonths: 6,
      sampleMonths: 4,
      total: { current: 2_340_000, median: 2_320_000 },
      highlights: [],
    },
  },
};

/** 평소와 정확히 같은 금액 (이모지 없음) */
export const NoChange: Story = {
  args: {
    comparison: {
      windowMonths: 6,
      sampleMonths: 2,
      total: { current: 700_000, median: 700_000 },
      highlights: [],
    },
  },
};

/** 수입 탭: 감소가 나쁜 변화 🚨, 문구는 "들어왔어요" */
export const IncomeDecreased: Story = {
  args: {
    group: 'income',
    comparison: {
      windowMonths: 6,
      sampleMonths: 6,
      total: { current: 3_200_000, median: 3_700_000 },
      highlights: [{ category: '상여', kind: 'missing', current: 0, median: 500_000 }],
    },
  },
};

/** 긴 카테고리 이름은 말줄임 */
export const LongCategoryName: Story = {
  args: {
    comparison: {
      windowMonths: 6,
      sampleMonths: 3,
      total: { current: 1_200_000, median: 900_000 },
      highlights: [
        {
          category: '아주아주긴카테고리이름입니다',
          kind: 'high',
          current: 400_000,
          median: 100_000,
        },
      ],
    },
  },
};

/** 링크 없이 읽기 전용으로 쓰는 경우 (행 끝 › 없음) */
export const ReadOnly: Story = {
  args: { ...Overspent.args, hrefOf: undefined },
};

/** 지난달 기록이 2개월 미만이라 비교할 수 없는 경우 */
export const NotEnoughData: Story = {
  args: { comparison: null },
};

export const Loading: Story = {
  args: { comparison: null, isLoading: true },
};
