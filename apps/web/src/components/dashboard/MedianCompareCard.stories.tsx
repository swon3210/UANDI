import type { Meta, StoryObj } from '@storybook/react';
import { MedianCompareCard } from './MedianCompareCard';
import type { MedianComparison } from '@/utils/median-comparison';

const COLORS: Record<string, string> = {
  여행: '#5B8DEF',
  식비: '#D8635A',
  월세: '#6B7280',
  교통: '#8B5CF6',
  데이트: '#F59E0B',
  정기급여: '#5B9A6F',
  상여: '#3B82F6',
};

const meta: Meta<typeof MedianCompareCard> = {
  title: 'Dashboard/MedianCompareCard',
  component: MedianCompareCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    group: 'expense',
    currentLabel: '2026년 8월',
    colorOf: (name) => COLORS[name] ?? '#9CA3AF',
  },
};
export default meta;

type Story = StoryObj<typeof MedianCompareCard>;

const overspent: MedianComparison = {
  windowMonths: 6,
  sampleMonths: 5,
  total: { current: 7_065_000, median: 2_320_000 },
  highlights: [
    {
      category: '여행',
      kind: 'high',
      current: 3_533_000,
      median: 200_000,
      seenMonths: 3,
      record: 'max',
    },
    {
      category: '병원/건강',
      kind: 'high',
      current: 563_000,
      median: 80_000,
      seenMonths: 5,
      record: null,
    },
    {
      category: '교통',
      kind: 'low',
      current: 146_000,
      median: 320_000,
      seenMonths: 5,
      record: 'min',
    },
    { category: '데이트', kind: 'new', current: 61_000, median: 0, seenMonths: 0, record: null },
    { category: '월세', kind: 'missing', current: 0, median: 700_000, seenMonths: 5, record: null },
  ],
};

/** 이번 달 지출이 평소보다 훨씬 많고, 많이/적게/처음/없음 네 종류가 모두 섞인 경우 */
export const Overspent: Story = {
  args: { comparison: overspent, ongoingDay: 20 },
};

/** 평소보다 적게 쓴 달 (좋은 변화 😎) */
export const Underspent: Story = {
  args: {
    comparison: {
      windowMonths: 6,
      sampleMonths: 6,
      total: { current: 1_540_000, median: 2_320_000 },
      highlights: [
        {
          category: '식비',
          kind: 'low',
          current: 280_000,
          median: 620_000,
          seenMonths: 6,
          record: 'min',
        },
        {
          category: '여행',
          kind: 'missing',
          current: 0,
          median: 200_000,
          seenMonths: 4,
          record: null,
        },
      ],
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
      highlights: [
        {
          category: '상여',
          kind: 'missing',
          current: 0,
          median: 500_000,
          seenMonths: 4,
          record: null,
        },
      ],
    },
  },
};

/** 눈에 띄는 카테고리가 5개를 넘어 "더 보기"가 붙는 경우 */
export const ManyHighlights: Story = {
  args: {
    comparison: {
      ...overspent,
      highlights: [
        ...overspent.highlights,
        {
          category: '소모품',
          kind: 'high',
          current: 425_000,
          median: 120_000,
          seenMonths: 6,
          record: null,
        },
        {
          category: '친구',
          kind: 'high',
          current: 223_000,
          median: 60_000,
          seenMonths: 5,
          record: 'max',
        },
        {
          category: '아주아주긴카테고리이름입니다',
          kind: 'new',
          current: 15_000,
          median: 0,
          seenMonths: 1,
          record: null,
        },
      ],
    },
  },
};

/** 지난달 기록이 2개월 미만이라 비교할 수 없는 경우 */
export const NotEnoughData: Story = {
  args: { comparison: null },
};

export const Loading: Story = {
  args: { comparison: null, isLoading: true },
};
