import type { Meta, StoryObj } from '@storybook/react';
import { CashbookFilterBar } from './CashbookFilterBar';

const meta: Meta<typeof CashbookFilterBar> = {
  title: 'Cashbook/CashbookFilterBar',
  component: CashbookFilterBar,
  parameters: { layout: 'centered' },
  args: {
    sort: 'latest',
    onSortChange: (s) => console.log('sort', s),
    onOpen: () => console.log('open'),
    onPrevMonth: () => console.log('prev'),
    onNextMonth: () => console.log('next'),
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashbookFilterBar>;

// 월 모드: 상단 연도 표시 + 좌우 화살표 스테퍼('월'만) + 필터 버튼
export const MonthMode: Story = {
  args: {
    period: { mode: 'month', year: 2024, month: 0 },
    periodLabel: '2024년 1월',
    activeCount: 0,
    canGoNext: true,
  },
};

// 이번 달: 다음 달 화살표 비활성
export const CurrentMonthNextDisabled: Story = {
  args: {
    period: { mode: 'month', year: 2024, month: 0 },
    periodLabel: '2024년 1월',
    activeCount: 0,
    canGoNext: false,
  },
};

// 필터 활성: 조건 개수 배지
export const WithActiveCount: Story = {
  args: {
    period: { mode: 'month', year: 2024, month: 0 },
    periodLabel: '2024년 1월',
    activeCount: 2,
    canGoNext: true,
  },
};

// 범위 모드: 화살표 없이 라벨만(탭 시 시트 열림)
export const RangeMode: Story = {
  args: {
    period: { mode: 'last3Months' },
    periodLabel: '2023년 11월 ~ 2024년 1월',
    activeCount: 1,
    canGoNext: false,
  },
};

// 금액순 정렬 선택 상태
export const AmountSort: Story = {
  args: {
    period: { mode: 'month', year: 2024, month: 0 },
    periodLabel: '2024년 1월',
    activeCount: 0,
    canGoNext: true,
    sort: 'amountDesc',
  },
};
