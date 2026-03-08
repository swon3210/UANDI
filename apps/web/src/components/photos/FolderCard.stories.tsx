import type { Meta, StoryObj } from '@storybook/react';
import type { Folder } from '@/types';
import { FolderCard } from './FolderCard';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

const mockFolder = {
  id: 'folder-1',
  coupleId: 'couple-1',
  name: '제주도 여행',
  createdBy: 'user-1',
  createdAt: ts,
} as unknown as Folder;

const meta: Meta<typeof FolderCard> = {
  title: 'Photos/FolderCard',
  component: FolderCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '폴더를 카드 형태로 표시하는 컴포넌트. 커버 이미지, 폴더명, 사진 수를 보여줍니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FolderCard>;

export const WithCover: Story = {
  name: '커버 이미지 있음',
  args: {
    folder: mockFolder,
    coverUrl: 'https://picsum.photos/seed/jeju/800/500',
    photoCount: 24,
  },
};

export const NoCover: Story = {
  name: '커버 이미지 없음',
  args: {
    folder: { ...mockFolder, name: '빈 폴더' },
    coverUrl: null,
    photoCount: 0,
  },
};

export const LongName: Story = {
  name: '긴 폴더 이름',
  args: {
    folder: { ...mockFolder, name: '2024년 여름 제주도 가족 여행 사진 모음집' },
    coverUrl: 'https://picsum.photos/seed/long/800/500',
    photoCount: 156,
  },
};
