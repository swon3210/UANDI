import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { DeleteFolderConfirmSheet } from './DeleteFolderConfirmSheet';

const noop = () => {};

const meta: Meta<typeof DeleteFolderConfirmSheet> = {
  title: 'Photos/DeleteFolderConfirmSheet',
  component: DeleteFolderConfirmSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '폴더 재귀 삭제 확인 바텀시트. 하위 폴더/사진 개수를 미리 보여주고 사용자가 명시적으로 확인하게 함.',
      },
    },
  },
  args: {
    onConfirm: noop,
    onCancel: noop,
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
type Story = StoryObj<typeof DeleteFolderConfirmSheet>;

export const EmptyFolder: Story = {
  name: '빈 폴더 (하위 0, 사진 0)',
  args: {
    folderName: '빈 폴더',
    count: { folders: 0, photos: 0 },
  },
};

export const PhotosOnly: Story = {
  name: '사진만 있음',
  args: {
    folderName: '제주도 여행',
    count: { folders: 0, photos: 24 },
  },
};

export const NestedAndPhotos: Story = {
  name: '하위 폴더 + 사진 모두 있음',
  args: {
    folderName: '여행',
    count: { folders: 3, photos: 87 },
  },
};

export const LoadingCounts: Story = {
  name: '개수 로딩 중',
  args: {
    folderName: '여행',
    count: null,
    isLoading: true,
  },
};

export const Deleting: Story = {
  name: '삭제 진행 중',
  args: {
    folderName: '여행',
    count: { folders: 3, photos: 87 },
    isDeleting: true,
  },
};
