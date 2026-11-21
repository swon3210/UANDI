import type { Meta, StoryObj } from '@storybook/react';
import { AccountInfoCard } from './AccountInfoCard';

const meta: Meta<typeof AccountInfoCard> = {
  title: 'Settings/계정/계정 정보 카드',
  component: AccountInfoCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '계정 관리 페이지 상단 카드. 로그인 이메일과 로그인 수단(Google/Apple)을 읽기 전용으로 보여준다. ' +
          '로그인 수단을 알 수 없으면(provider=null) 그 행은 숨긴다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AccountInfoCard>;

export const Google: Story = {
  args: { email: 'malang@gmail.com', provider: 'google' },
};

export const Apple: Story = {
  name: 'Apple',
  args: { email: 'malang@privaterelay.appleid.com', provider: 'apple' },
};

export const ProviderUnknown: Story = {
  name: '로그인 수단 알 수 없음',
  args: { email: 'malang@gmail.com', provider: null },
};

export const LongEmail: Story = {
  name: '긴 이메일(말줄임)',
  args: {
    email: 'very.long.email.address.for.overflow.check.1234567890@example-domain.co.kr',
    provider: 'google',
  },
};
