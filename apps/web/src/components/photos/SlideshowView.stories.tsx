import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { Photo, Folder } from '@/types';
import { SlideshowView } from './SlideshowView';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

const mockPhotos = Array.from({ length: 5 }, (_, i) => ({
  id: `photo-${i + 1}`,
  coupleId: 'couple-1',
  uploadedBy: 'user-1',
  folderId: 'folder-1',
  tags: ['벚꽃', '바다'],
  storageUrl: `https://picsum.photos/seed/slide${i + 1}/1200/800`,
  thumbnailUrl: null,
  caption: i === 0 ? '이 날 정말 행복했어 ☺' : i === 2 ? '제주도 바다' : '',
  takenAt: ts,
  uploadedAt: ts,
  width: 1200,
  height: 800,
})) as unknown as Photo[];

const mockFolder: Folder = {
  id: 'folder-1',
  coupleId: 'couple-1',
  name: '제주도 여행',
  createdBy: 'user-1',
  createdAt: ts,
} as unknown as Folder;

const meta: Meta<typeof SlideshowView> = {
  title: 'Photos/SlideshowView',
  component: SlideshowView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '전체화면 슬라이드쇼. 좌우 영역 탭/스와이프로 사진 전환, 5초 무조작 시 오버레이 자동 숨김.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SlideshowView>;

function SlideshowWrapper() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          슬라이드쇼 다시 열기
        </button>
      </div>
    );
  }
  return <SlideshowView photos={mockPhotos} folder={mockFolder} onClose={() => setOpen(false)} />;
}

export const Default: Story = {
  name: '기본 (5장)',
  render: () => <SlideshowWrapper />,
};

function SinglePhotoWrapper() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          다시 열기
        </button>
      </div>
    );
  }
  return (
    <SlideshowView photos={[mockPhotos[0]]} folder={mockFolder} onClose={() => setOpen(false)} />
  );
}

export const SinglePhoto: Story = {
  name: '사진 1장',
  render: () => <SinglePhotoWrapper />,
};

function NoFolderWrapper() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          다시 열기
        </button>
      </div>
    );
  }
  return <SlideshowView photos={mockPhotos} onClose={() => setOpen(false)} />;
}

export const WithoutFolder: Story = {
  name: '폴더 없이 (태그 기준)',
  render: () => <NoFolderWrapper />,
};
