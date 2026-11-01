import type { Meta, StoryObj } from '@storybook/react';
import { InviteCodeHint } from './InviteCodeHint';

const meta: Meta<typeof InviteCodeHint> = {
  title: 'Onboarding/InviteCodeHint',
  component: InviteCodeHint,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '코드 입력 화면의 미리보기 한 줄. 6자리를 다 치면 "OO님의 초대예요"로 맞는 코드인지 알려 준다. ' +
          'idle·unavailable은 아무것도 그리지 않는다(거절 사유는 연결하기 때 에러로).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InviteCodeHint>;

export const Loading: Story = { name: '확인 중', args: { status: 'loading' } };

export const Found: Story = {
  name: '초대한 사람 있음',
  args: { status: 'found', inviterName: '진성' },
};

export const FoundWithoutName: Story = {
  name: '이름 없는 구버전 코드',
  args: { status: 'found', inviterName: null },
};

export const Idle: Story = { name: '입력 전 (아무것도 없음)', args: { status: 'idle' } };
