import type { Meta, StoryObj } from '@storybook/react';
import type { Photo } from '@/types';
import { PhotoGrid } from './PhotoGrid';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

const mockPhotos = Array.from({ length: 8 }, (_, i) => ({
  id: `photo-${i + 1}`,
  coupleId: 'couple-1',
  uploadedBy: 'user-1',
  folderId: 'folder-1',
  tags: ['여행', '제주도'],
  storageUrl: `https://picsum.photos/seed/${i + 1}/400/400`,
  thumbnailUrl: `https://picsum.photos/seed/${i + 1}/200/200`,
  caption: `사진 ${i + 1}`,
  takenAt: ts,
  uploadedAt: ts,
  width: 400,
  height: 400,
})) as unknown as Photo[];

const meta: Meta<typeof PhotoGrid> = {
  title: 'Photos/PhotoGrid',
  component: PhotoGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '사진을 그리드로 표시하는 컴포넌트. 반응형 2/3/4열 레이아웃을 지원합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PhotoGrid>;

export const Default: Story = {
  name: '기본 (8장)',
  args: {
    photos: mockPhotos,
  },
};

export const FewPhotos: Story = {
  name: '사진 3장',
  args: {
    photos: mockPhotos.slice(0, 3),
  },
};

export const Loading: Story = {
  name: '로딩 스켈레톤',
  args: {
    photos: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  name: '사진 없음',
  args: {
    photos: [],
  },
};
