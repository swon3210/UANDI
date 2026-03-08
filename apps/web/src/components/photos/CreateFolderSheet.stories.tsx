import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { CreateFolderSheet } from './CreateFolderSheet';

const noop = () => {};

const meta: Meta<typeof CreateFolderSheet> = {
  title: 'Photos/CreateFolderSheet',
  component: CreateFolderSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '새 폴더 생성 바텀시트. 폴더 이름을 입력받고 생성 버튼을 제공합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', background: '#f5f5f0', padding: '24px' }}>
        <p style={{ color: '#706C67', fontSize: '14px' }}>페이지 콘텐츠 영역 (바텀시트 뒤 배경)</p>
        <Sheet open>
          <Story />
        </Sheet>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateFolderSheet>;

export const Default: Story = {
  name: '기본',
  args: {
    onSubmit: noop,
  },
};

export const Pending: Story = {
  name: '생성 중',
  args: {
    onSubmit: noop,
    isPending: true,
  },
};
