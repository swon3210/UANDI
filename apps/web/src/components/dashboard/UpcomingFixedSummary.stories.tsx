import type { Meta, StoryObj } from '@storybook/react';
import { UpcomingFixedSummary } from './UpcomingFixedSummary';

const meta: Meta<typeof UpcomingFixedSummary> = {
  title: 'Dashboard/UpcomingFixedSummary',
  component: UpcomingFixedSummary,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    onClick: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof UpcomingFixedSummary>;

const NONE = { count: 0, amount: 0 };

/** 지출 탭: 예정 2건 + 월말 예상 합계 */
export const ExpenseTab: Story = {
  args: {
    group: 'expense',
    expense: { count: 2, amount: 1_300_000 },
    income: NONE,
    overdueCount: 0,
    actualTotal: 1_370_000,
  },
};

/** 수입 탭: 월급 1건 */
export const IncomeTab: Story = {
  args: {
    group: 'income',
    expense: NONE,
    income: { count: 1, amount: 3_000_000 },
    overdueCount: 0,
    actualTotal: 150_000,
  },
};

/** 전체 탭: 수입·지출 각 한 줄, 월말 예상은 게이지 쪽에서 보여주므로 없음 */
export const AllTab: Story = {
  args: {
    group: 'all',
    expense: { count: 2, amount: 1_300_000 },
    income: { count: 1, amount: 3_000_000 },
    overdueCount: 0,
  },
};

/** 전체 탭에서 지출만 예정이 있을 때 */
export const AllTabExpenseOnly: Story = {
  args: {
    group: 'all',
    expense: { count: 3, amount: 1_480_000 },
    income: NONE,
    overdueCount: 0,
  },
};

/** 발생일이 지났는데 기록하지 않은 항목이 있을 때 (합계엔 안 들어감) */
export const WithOverdue: Story = {
  args: {
    group: 'expense',
    expense: { count: 1, amount: 800_000 },
    income: NONE,
    overdueCount: 2,
    actualTotal: 420_000,
  },
};

/** 남은 예정은 없고 미기록만 있을 때 */
export const OverdueOnly: Story = {
  args: {
    group: 'expense',
    expense: NONE,
    income: NONE,
    overdueCount: 1,
    actualTotal: 420_000,
  },
};

/** 큰 금액 (자릿수 많은 경우 줄바꿈 확인) */
export const LargeAmount: Story = {
  args: {
    group: 'expense',
    expense: { count: 7, amount: 123_456_789 },
    income: NONE,
    overdueCount: 0,
    actualTotal: 98_765_432,
  },
};

/** 예정도 미기록도 없으면 아무것도 그리지 않는다 */
export const Nothing: Story = {
  args: {
    group: 'expense',
    expense: NONE,
    income: NONE,
    overdueCount: 0,
    actualTotal: 0,
  },
};
