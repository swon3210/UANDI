import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { RenameFolderSheet } from './RenameFolderSheet';

const noop = () => {};

const meta: Meta<typeof RenameFolderSheet> = {
  title: 'Photos/RenameFolderSheet',
  component: RenameFolderSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '폴더 이름 변경 바텀시트. 현재 이름이 미리 채워지고, 변경된 경우에만 버튼이 활성화됩니다.',
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
type Story = StoryObj<typeof RenameFolderSheet>;

export const Default: Story = {
  name: '기본',
  args: {
    currentName: '제주도 여행',
    onSubmit: noop,
  },
};

export const Pending: Story = {
  name: '변경 중',
  args: {
    currentName: '제주도 여행',
    onSubmit: noop,
    isPending: true,
  },
};
