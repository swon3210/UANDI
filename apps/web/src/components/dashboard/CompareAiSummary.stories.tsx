import type { Meta, StoryObj } from '@storybook/react';
import { CompareAiSummary, type CompareAiSummaryItem } from './CompareAiSummary';

const ITEMS: CompareAiSummaryItem[] = [
  {
    category: '여행',
    color: '#5B8DEF',
    current: 1_250_000,
    compare: 0,
    reason: '제주 항공권·숙소가 몰렸어요',
  },
  {
    category: '식비',
    color: '#F2994A',
    current: 420_000,
    compare: 320_000,
    reason: '회식이 두 번 있었어요',
  },
  {
    category: '소비',
    color: '#EB5757',
    current: 90_000,
    compare: 100_000,
    reason: '옷 구매를 미뤘어요',
  },
  {
    category: '교통',
    color: '#2D9CDB',
    current: 60_000,
    compare: 77_500,
    reason: '택시를 덜 탔어요',
  },
  { category: '구독', color: '#9B51E0', current: 15_000, compare: 15_000, reason: '평소와 같아요' },
];

const meta: Meta<typeof CompareAiSummary> = {
  title: 'Dashboard/CompareAiSummary',
  component: CompareAiSummary,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    scopeTitle: '전체 변동 지출',
    compareLabel: '평소',
    group: 'expense',
    items: ITEMS,
    overall: '여행이 몰려 늘었지만 나머지는 평소보다 아꼈어요',
    status: 'success',
    onRetry: () => {},
    href: '#',
  },
};
export default meta;

type Story = StoryObj<typeof CompareAiSummary>;

/** 변화가 큰 5개: 증감 막대 + AI 한 줄 이유 */
export const Success: Story = {};

/** AI 이유가 아직 없을 때 — 막대는 바로 보이고 이유 자리는 스켈레톤 */
export const WaitingForReasons: Story = {
  args: {
    status: 'loading',
    overall: undefined,
    items: ITEMS.map(({ reason: _reason, ...item }) => item),
  },
};

/** 앞의 두 줄만 이유가 들어온 스트리밍 중 */
export const Streaming: Story = {
  args: {
    status: 'streaming',
    items: ITEMS.map((item, i) => (i < 2 ? item : { ...item, reason: undefined })),
  },
};

/** 수입: 증가가 좋은 변화(초록) */
export const Income: Story = {
  args: {
    scopeTitle: '전체 수입',
    compareLabel: '9월',
    group: 'income',
    items: [
      {
        category: '상여',
        color: '#27AE60',
        current: 1_000_000,
        compare: 0,
        reason: '추석 상여가 들어왔어요',
      },
      {
        category: '정기급여',
        color: '#6FCF97',
        current: 3_200_000,
        compare: 3_300_000,
        reason: '야근 수당이 줄었어요',
      },
    ],
  },
};

/** 일일 한도 초과 등 실패 — 막대는 그대로, 이유 대신 안내 */
export const Failed: Story = {
  args: {
    status: 'error',
    overall: undefined,
    errorMessage: '일일 사용 한도를 초과했습니다',
    items: ITEMS.map(({ reason: _reason, ...item }) => item),
  },
};

export const LongNames: Story = {
  args: {
    scopeTitle: '아주아주긴카테고리이름입니다정말로길어요',
    items: [
      {
        category: '아주아주긴카테고리이름입니다정말로',
        color: '#9B9B9B',
        current: 123_456_789,
        compare: 98_765_432,
        reason: '이유도 길면 줄바꿈되어 두 줄까지 자연스럽게 보여요',
      },
    ],
  },
};
