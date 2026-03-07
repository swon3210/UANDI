import type { Meta, StoryObj } from '@storybook/react';
import { FullScreenSpinner } from './FullScreenSpinner';

const meta: Meta<typeof FullScreenSpinner> = {
  title: 'Custom/FullScreenSpinner',
  component: FullScreenSpinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '전체 화면 로딩 스피너. 인증 상태 확인 등 페이지 전환 시 사용합니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FullScreenSpinner>;

export const Default: Story = {
  name: '기본',
};
