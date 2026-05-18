import type { Meta, StoryObj } from '@storybook/react';
import { FcmForegroundToastPreview } from './FcmForegroundToastPreview';

const meta: Meta<typeof FcmForegroundToastPreview> = {
  title: 'Cashbook/FcmForegroundToastPreview',
  component: FcmForegroundToastPreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'FCM 포그라운드 메시지를 in-app toast로 표시하는 동작 시각 확인용.\n\n' +
          '- **파트너 알림**: `toast.warning`, duration 6s, "보기" 액션 포함\n' +
          '- **본인 알림**: 기본 `toast`, duration 3s, 짧고 덜 침습적\n\n' +
          '`selfAlertEnabled=false`이면 본인 알림은 무시(토스트가 뜨지 않음).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FcmForegroundToastPreview>;

export const SelfAlertOn: Story = {
  name: '본인 알림 ON (기본)',
  args: { selfAlertEnabled: true },
};

export const SelfAlertOff: Story = {
  name: '본인 알림 OFF',
  args: { selfAlertEnabled: false },
};
