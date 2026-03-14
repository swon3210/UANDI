import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import type { Folder } from '@/types';
import { MovePhotosSheet } from './MovePhotosSheet';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

const mockFolders: Folder[] = [
  { id: 'folder-1', coupleId: 'c1', name: '제주도 여행', createdBy: 'u1', createdAt: ts },
  { id: 'folder-2', coupleId: 'c1', name: '우리집 일상', createdBy: 'u1', createdAt: ts },
  { id: 'folder-3', coupleId: 'c1', name: '데이트', createdBy: 'u1', createdAt: ts },
  { id: 'folder-4', coupleId: 'c1', name: '기념일', createdBy: 'u1', createdAt: ts },
] as unknown as Folder[];

const meta: Meta<typeof MovePhotosSheet> = {
  title: 'Photos/MovePhotosSheet',
  component: MovePhotosSheet,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '사진 일괄 이동 시 폴더를 선택하는 바텀 시트.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MovePhotosSheet>;

export const Default: Story = {
  name: '기본 (현재 폴더: 제주도 여행)',
  args: {
    folders: mockFolders,
    currentFolderId: 'folder-1',
    selectedCount: 3,
    onMove: () => {},
  },
};

export const OnlyOneOtherFolder: Story = {
  name: '이동 가능한 폴더 1개',
  args: {
    folders: mockFolders.slice(0, 2),
    currentFolderId: 'folder-1',
    selectedCount: 1,
    onMove: () => {},
  },
};
