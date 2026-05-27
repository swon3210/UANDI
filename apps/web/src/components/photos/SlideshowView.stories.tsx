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

function StartFromMiddleWrapper() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          슬라이드쇼 다시 열기 (3번째 사진부터)
        </button>
      </div>
    );
  }
  return (
    <SlideshowView
      photos={mockPhotos}
      initialIndex={2}
      folder={mockFolder}
      onClose={() => setOpen(false)}
    />
  );
}

export const StartFromMiddle: Story = {
  name: '특정 인덱스부터 시작 (initialIndex=2)',
  render: () => <StartFromMiddleWrapper />,
};

function NextFolderCallbackWrapper() {
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  if (!open) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          슬라이드쇼 다시 열기
        </button>
        <pre className="max-h-40 overflow-auto text-xs text-muted-foreground">
          {log.length === 0 ? '아직 호출 없음' : log.join('\n')}
        </pre>
      </div>
    );
  }
  return (
    <SlideshowView
      photos={mockPhotos}
      folder={mockFolder}
      onClose={() => setOpen(false)}
      onLastPhotoNext={() => {
        const at = new Date().toLocaleTimeString();
        setLog((prev) => [...prev, `${at} — 다음 폴더 요청`]);
      }}
    />
  );
}

export const WithNextFolderCallback: Story = {
  name: '다음 폴더 콜백 (마지막 사진에서 → 트리거)',
  render: () => <NextFolderCallbackWrapper />,
};
