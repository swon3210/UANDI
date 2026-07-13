import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { CashflowSettingsForm } from './CashflowSettingsForm';
import type { CashflowMember } from '@/utils/cashflow';

const twoMembers: CashflowMember[] = [
  { uid: 'u1', displayName: '지훈', photoURL: null },
  { uid: 'u2', displayName: '서연', photoURL: null },
];

const meta: Meta<typeof CashflowSettingsForm> = {
  title: 'Cashbook/Cashflow/SettingsForm',
  component: CashflowSettingsForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowSettingsForm>;

const noop = () => {};

export const Empty: Story = {
  args: { members: twoMembers, onSubmit: noop, onClose: noop },
};

export const Prefilled: Story = {
  args: {
    members: twoMembers,
    initial: {
      initialCashByUid: { u1: 1500000, u2: 1000000 },
      initialDate: new Date('2026-01-01T00:00:00'),
    },
    onSubmit: noop,
    onClose: noop,
  },
};

/** 커플 미연결(멤버 1명) — 입력 1개로 자연 축소, 합계 줄 없음. */
export const SingleMember: Story = {
  args: {
    members: [{ uid: 'u1', displayName: '지훈', photoURL: null }],
    onSubmit: noop,
    onClose: noop,
  },
};

/** 긴 이름 — 라벨이 잘려도 입력이 밀리지 않는다. */
export const LongNames: Story = {
  args: {
    members: [
      { uid: 'u1', displayName: '아주아주긴이름을가진사람하나', photoURL: null },
      { uid: 'u2', displayName: '또다른아주긴이름의배우자', photoURL: null },
    ],
    onSubmit: noop,
    onClose: noop,
  },
};
