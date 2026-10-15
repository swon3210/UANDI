import type { Meta, StoryObj } from '@storybook/react';
import { IncomeExpenseMeter } from './IncomeExpenseMeter';

const meta: Meta<typeof IncomeExpenseMeter> = {
  title: 'Dashboard/IncomeExpenseMeter',
  component: IncomeExpenseMeter,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof IncomeExpenseMeter>;

export const UnderIncome: Story = {
  args: { income: 3_200_000, expense: 2_100_000 },
};

export const NearlyFull: Story = {
  args: { income: 3_200_000, expense: 3_050_000 },
};

export const OverIncome: Story = {
  args: { income: 2_500_000, expense: 3_380_000 },
};

export const NoIncome: Story = {
  args: { income: 0, expense: 420_000 },
};

export const NoExpense: Story = {
  args: { income: 3_200_000, expense: 0 },
};

export const Empty: Story = {
  args: { income: 0, expense: 0 },
};

/** 이번 달: 월급은 아직 안 들어왔고, 월세·보험이 빠져나갈 예정 → 월말 예상 남은 금액이 머리기사 */
export const WithUpcoming: Story = {
  args: {
    income: 1_000_000,
    expense: 300_000,
    upcoming: { income: 3_000_000, expense: 1_300_000, count: 3 },
    onUpcomingClick: () => {},
  },
};

/** 예정 지출만 있을 때: 빗금 구간이 실제 지출 뒤에 이어진다 */
export const UpcomingExpenseOnly: Story = {
  args: {
    income: 3_200_000,
    expense: 1_200_000,
    upcoming: { income: 0, expense: 1_300_000, count: 2 },
    onUpcomingClick: () => {},
  },
};

/** 예정을 반영하면 수입을 넘기는 경우: 부족 금액이 빨간 머리기사 */
export const UpcomingOverIncome: Story = {
  args: {
    income: 2_000_000,
    expense: 1_500_000,
    upcoming: { income: 0, expense: 900_000, count: 1, overdueCount: 2 },
    onUpcomingClick: () => {},
  },
};

/** 월초: 실제 수입이 아직 없어 트랙은 없지만 예정 반영 잔액은 보여준다 */
export const UpcomingNoIncomeYet: Story = {
  args: {
    income: 0,
    expense: 120_000,
    upcoming: { income: 3_000_000, expense: 800_000, count: 2 },
    onUpcomingClick: () => {},
  },
};
