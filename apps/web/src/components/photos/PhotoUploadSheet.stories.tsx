import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { Sheet } from '@uandi/ui';
import { PhotoUploadSheet } from './PhotoUploadSheet';
import type { Folder } from '@/types';

const mockFolders: Folder[] = [
  { id: 'f1', coupleId: 'c1', name: '제주도 여행', createdBy: 'u1', createdAt: Timestamp.now() },
  { id: 'f2', coupleId: 'c1', name: '일상', createdBy: 'u1', createdAt: Timestamp.now() },
  { id: 'f3', coupleId: 'c1', name: '결혼식', createdBy: 'u1', createdAt: Timestamp.now() },
];

const meta: Meta<typeof PhotoUploadSheet> = {
  title: 'Photos/PhotoUploadSheet',
  component: PhotoUploadSheet,
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PhotoUploadSheet>;

export const Default: Story = {
  args: {
    folders: mockFolders,
    tagSuggestions: ['벚꽃', '바다', '카페', '여행'],
    onCreateFolder: async (name) => {
      await new Promise((r) => setTimeout(r, 300));
      return `new-${name}`;
    },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 2000));
    },
  },
};

export const NoFolders: Story = {
  args: {
    folders: [],
    tagSuggestions: [],
    onCreateFolder: async (name) => {
      await new Promise((r) => setTimeout(r, 300));
      return `new-${name}`;
    },
    onSubmit: async () => {},
  },
};
