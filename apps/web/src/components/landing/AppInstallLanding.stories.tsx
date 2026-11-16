import type { Meta, StoryObj } from '@storybook/react';
import { AppInstallLanding } from './AppInstallLanding';

const meta: Meta<typeof AppInstallLanding> = {
  title: 'Onboarding/AppInstallLanding',
  component: AppInstallLanding,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '앱 설치 안내(/get-app). 일반 브라우저로 들어온 사람에게 스토어 링크만 보여준다. ' +
          '로그인 버튼은 없다. 초대 링크로 들어온 경우 설치 후 링크를 다시 누르라는 안내를 얹는다.',
      },
    },
  },
  args: {
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.swon3210.uandi',
    appStoreUrl: 'https://apps.apple.com/app/id6790130439',
  },
  decorators: [
    (Story) => (
      <div className="flex w-[375px] justify-center px-4 py-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppInstallLanding>;

export const Default: Story = { name: '기본' };

export const FromInvite: Story = {
  name: '초대 링크로 진입',
  args: { fromInvite: true },
};
