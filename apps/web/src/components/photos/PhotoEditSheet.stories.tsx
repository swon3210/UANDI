import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { Sheet } from '@uandi/ui';
import { PhotoEditSheet } from './PhotoEditSheet';
import type { Photo, Folder } from '@/types';

const mockFolders: Folder[] = [
  { id: 'f1', coupleId: 'c1', name: '제주도 여행', createdBy: 'u1', createdAt: Timestamp.now() },
  { id: 'f2', coupleId: 'c1', name: '일상', createdBy: 'u1', createdAt: Timestamp.now() },
];

const mockPhoto: Photo = {
  id: 'p1',
  coupleId: 'c1',
  uploadedBy: 'u1',
  folderId: 'f1',
  tags: ['벚꽃', '바다'],
  storageUrl: 'https://example.com/photo.jpg',
  thumbnailUrl: null,
  caption: '이 날 정말 행복했어',
  takenAt: Timestamp.now(),
  uploadedAt: Timestamp.now(),
  width: 1920,
  height: 1080,
};

const meta: Meta<typeof PhotoEditSheet> = {
  title: 'Photos/PhotoEditSheet',
  component: PhotoEditSheet,
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PhotoEditSheet>;

export const Default: Story = {
  args: {
    photo: mockPhoto,
    folders: mockFolders,
    tagSuggestions: ['벚꽃', '바다', '카페', '여행'],
    isPending: false,
    onSubmit: () => {},
  },
};

export const EmptyCaption: Story = {
  args: {
    photo: { ...mockPhoto, caption: '', tags: [] },
    folders: mockFolders,
    tagSuggestions: [],
    isPending: false,
    onSubmit: () => {},
  },
};
