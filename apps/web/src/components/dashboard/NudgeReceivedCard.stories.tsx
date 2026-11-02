import type { Meta, StoryObj } from '@storybook/react';
import { NudgeReceivedCard } from './NudgeReceivedCard';

const meta: Meta<typeof NudgeReceivedCard> = {
  title: 'Dashboard/NudgeReceivedCard',
  component: NudgeReceivedCard,
  parameters: { layout: 'padded' },
  args: {
    partnerName: '세진',
    message: '오늘 쓴 거 입력해줘',
    onAdd: () => {},
    onDismiss: () => {},
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NudgeReceivedCard>;

/** 프리셋 문구로 받은 요청 */
export const Default: Story = {};

/** 문구 없이 보낸 요청 — 기본 안내 */
export const EmptyMessage: Story = {
  name: '문구 없음',
  args: { message: '' },
};

/** 직접 입력한 긴 문구는 줄바꿈된다 */
export const LongMessage: Story = {
  name: '긴 문구',
  args: {
    message:
      '어제 마트 다녀온 거랑 주말 외식, 그리고 카드값 빠져나간 것까지 오늘 안에 정리해 줄 수 있어? 내가 월말 점검하려고',
  },
};

/** 응답 저장 중 */
export const Pending: Story = {
  name: '응답 저장 중',
  args: { isPending: true },
};
