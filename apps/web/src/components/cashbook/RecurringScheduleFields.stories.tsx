import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  RecurringScheduleFields,
  type PayerOption,
  type RecurringScheduleValue,
} from './RecurringScheduleFields';

const meta: Meta<typeof RecurringScheduleFields> = {
  title: 'Cashbook/RecurringScheduleFields',
  component: RecurringScheduleFields,
  decorators: [
    (Story) => (
      <div className="max-w-sm rounded-lg border p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecurringScheduleFields>;

function Interactive({
  initial,
  variant,
  payerOptions,
  defaultPayerUid,
}: {
  initial: RecurringScheduleValue;
  variant?: 'income' | 'expense';
  payerOptions?: PayerOption[];
  defaultPayerUid?: string;
}) {
  const [value, setValue] = useState<RecurringScheduleValue>(initial);
  return (
    <RecurringScheduleFields
      value={value}
      onChange={setValue}
      variant={variant}
      payerOptions={payerOptions}
      defaultPayerUid={defaultPayerUid}
    />
  );
}

export const Disabled: Story = {
  render: () => <Interactive initial={{ enabled: false, kind: 'dayOfMonth' }} />,
};

export const DayOfMonth: Story = {
  render: () => (
    <Interactive
      initial={{ enabled: true, kind: 'dayOfMonth', dayOfMonth: 25, expectedAmount: 800000 }}
    />
  ),
};

export const NthWeekday: Story = {
  render: () => (
    <Interactive
      initial={{ enabled: true, kind: 'nthWeekday', week: 2, weekday: 3, leadDays: 3 }}
    />
  ),
};

export const LastWeek: Story = {
  render: () => (
    <Interactive initial={{ enabled: true, kind: 'nthWeekday', week: -1, weekday: 5 }} />
  ),
};

export const IncomeVariant: Story = {
  render: () => (
    <Interactive variant="income" initial={{ enabled: true, kind: 'dayOfMonth', dayOfMonth: 10 }} />
  ),
};

// 격월 상여: 발생 빈도 '격월' + 시작 월 셀렉트가 노출된다.
export const Bimonthly: Story = {
  render: () => (
    <Interactive
      variant="income"
      initial={{
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: 25,
        expectedAmount: 1000000,
        intervalMonths: 2,
        anchorMonth: '2026-07',
      }}
    />
  ),
};

// 분기 발생(예: 자동차세) — nthWeekday와 결합.
export const Quarterly: Story = {
  render: () => (
    <Interactive
      initial={{
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: 15,
        expectedAmount: 300000,
        intervalMonths: 3,
        anchorMonth: '2026-07',
      }}
    />
  ),
};

// ── 발생일 자동 기록 (docs/pages/inner/cashbook-recurring-auto-record.md) ──

const PAYERS = [
  { uid: 'me', label: '나' },
  { uid: 'partner', label: '지수' },
];

// 예상 금액이 없어 자동 기록 토글이 비활성 + 안내 문구.
export const AutoRecordDisabledNoAmount: Story = {
  render: () => (
    <Interactive
      initial={{ enabled: true, kind: 'dayOfMonth', dayOfMonth: 25 }}
      payerOptions={PAYERS}
      defaultPayerUid="me"
    />
  ),
};

// 자동 기록 on: 기록자 칩 2개(짝꿍 선택), 미리 알림 입력은 숨김.
export const AutoRecordOn: Story = {
  render: () => (
    <Interactive
      initial={{
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: 25,
        expectedAmount: 800000,
        autoRecord: true,
        payerUid: 'partner',
      }}
      payerOptions={PAYERS}
      defaultPayerUid="me"
    />
  ),
};

// 짝꿍 미연결(멤버 1명): 기록자 칩 없이 안내 문구만.
export const AutoRecordSingleMember: Story = {
  render: () => (
    <Interactive
      variant="income"
      initial={{
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: 10,
        expectedAmount: 3500000,
        autoRecord: true,
        payerUid: 'me',
      }}
      payerOptions={[{ uid: 'me', label: '나' }]}
      defaultPayerUid="me"
    />
  ),
};
