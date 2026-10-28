import dayjs from 'dayjs';
import type { Meta, StoryObj } from '@storybook/react';
import { CompareTargetPicker } from './CompareTargetPicker';

const today = dayjs('2026-10-15');

const meta: Meta<typeof CompareTargetPicker> = {
  title: 'Dashboard/CompareTargetPicker',
  component: CompareTargetPicker,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    kind: 'monthly',
    value: today.subtract(1, 'month').startOf('month'),
    defaultCursor: today.subtract(1, 'month').startOf('month'),
    today,
    onSelectMedian: () => {},
    onSelectPeriod: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof CompareTargetPicker>;

/** 월간 탭 기본: 전월이 선택돼 있고, 맨 위에 평소 옵션 */
export const MonthlyPrevMonth: Story = {};

/** 평소를 고른 상태: 평소 버튼이 강조되고 달 선택 표시는 없다 */
export const MonthlyMedianSelected: Story = {
  args: { value: 'median' },
};

/** 연간 탭: 평소 옵션 없이 연도 선택만 */
export const Yearly: Story = {
  args: {
    kind: 'yearly',
    value: today.subtract(1, 'year').startOf('year'),
    defaultCursor: today.subtract(1, 'year').startOf('year'),
  },
};
