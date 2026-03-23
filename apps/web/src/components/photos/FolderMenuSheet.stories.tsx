import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { FolderMenuSheet } from './FolderMenuSheet';

const noop = () => {};

const meta: Meta<typeof FolderMenuSheet> = {
  title: 'Photos/FolderMenuSheet',
  component: FolderMenuSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '폴더 관리 바텀시트. 이름 변경과 삭제 옵션을 제공합니다.',
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
type Story = StoryObj<typeof FolderMenuSheet>;

export const Default: Story = {
  name: '기본',
  args: {
    onRename: noop,
    onDelete: noop,
  },
};
