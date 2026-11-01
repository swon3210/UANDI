import type { Meta, StoryObj } from '@storybook/react';
import { LandingHero } from './LandingHero';

const meta: Meta<typeof LandingHero> = {
  title: 'Onboarding/LandingHero',
  component: LandingHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '랜딩 상단 소개 영역. 마스코트 일러스트 + "말랑 가계부"가 들어간 헤드라인 + 기능 3줄. ' +
          '초대 링크로 들어온 경우 상단에 초대 배너(코드 표시)를 얹는다. 로그인 버튼은 LandingPage 몫.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[375px] px-4 py-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LandingHero>;

export const Default: Story = { name: '기본' };

export const WithInviteBanner: Story = {
  name: '초대 링크로 진입',
  args: { pendingInviteCode: 'AB12CD' },
};
