import type { Meta, StoryObj } from '@storybook/react';
import type { Photo, Folder } from '@/types';
import { SlideshowOverlay } from './SlideshowOverlay';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

const mockPhoto: Photo = {
  id: 'photo-1',
  coupleId: 'couple-1',
  uploadedBy: 'user-1',
  folderId: 'folder-1',
  tags: ['벚꽃', '바다'],
  storageUrl: 'https://picsum.photos/seed/1/800/600',
  thumbnailUrl: null,
  caption: '이 날 정말 행복했어 ☺',
  takenAt: ts,
  uploadedAt: ts,
  width: 800,
  height: 600,
} as unknown as Photo;

const mockFolder: Folder = {
  id: 'folder-1',
  coupleId: 'couple-1',
  name: '제주도 여행',
  createdBy: 'user-1',
  createdAt: ts,
} as unknown as Folder;

const meta: Meta<typeof SlideshowOverlay> = {
  title: 'Photos/SlideshowOverlay',
  component: SlideshowOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '슬라이드쇼 상단/하단 오버레이. 닫기, 캡션 토글, 폴더명, 태그, 위치 정보를 표시합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-screen w-screen bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://picsum.photos/seed/demo/800/600"
          alt="demo"
          className="h-full w-full object-contain"
        />
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SlideshowOverlay>;

export const Active: Story = {
  name: 'Active (오버레이 표시)',
  args: {
    photo: mockPhoto,
    folder: mockFolder,
    currentIndex: 2,
    totalCount: 12,
    showCaption: false,
    visible: true,
    onClose: () => {},
    onToggleCaption: () => {},
  },
};

export const ActiveWithCaption: Story = {
  name: 'Active + 캡션 ON',
  args: {
    photo: mockPhoto,
    folder: mockFolder,
    currentIndex: 2,
    totalCount: 12,
    showCaption: true,
    visible: true,
    onClose: () => {},
    onToggleCaption: () => {},
  },
};

export const Idle: Story = {
  name: 'Idle (오버레이 숨김)',
  args: {
    photo: mockPhoto,
    folder: mockFolder,
    currentIndex: 2,
    totalCount: 12,
    showCaption: false,
    visible: false,
    onClose: () => {},
    onToggleCaption: () => {},
  },
};

export const NoTags: Story = {
  name: '태그 없음',
  args: {
    photo: { ...mockPhoto, tags: [] } as unknown as Photo,
    folder: mockFolder,
    currentIndex: 0,
    totalCount: 5,
    showCaption: false,
    visible: true,
    onClose: () => {},
    onToggleCaption: () => {},
  },
};

export const NoFolder: Story = {
  name: '폴더 없음',
  args: {
    photo: mockPhoto,
    folder: null,
    currentIndex: 0,
    totalCount: 1,
    showCaption: true,
    visible: true,
    onClose: () => {},
    onToggleCaption: () => {},
  },
};
