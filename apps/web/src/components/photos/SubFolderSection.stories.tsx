import type { Meta, StoryObj } from '@storybook/react';
import type { Folder } from '@/types';
import { SubFolderSection } from './SubFolderSection';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

function makeFolder(id: string, name: string): Folder {
  return {
    id,
    coupleId: 'c',
    name,
    createdBy: 'u',
    createdAt: ts,
    parentFolderId: 'parent',
    depth: 1,
    path: ['parent'],
  } as Folder;
}

const meta: Meta<typeof SubFolderSection> = {
  title: 'Photos/SubFolderSection',
  component: SubFolderSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '폴더 상세 페이지 상단의 하위 폴더 섹션. 하위 폴더 카드 그리드 + "새 하위 폴더" 버튼.',
      },
    },
  },
  args: {
    onCreateClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SubFolderSection>;

export const Empty: Story = {
  name: '하위 폴더 없음 (생성 가능)',
  args: {
    parentDepth: 0,
    subFolders: [],
  },
};

export const TwoChildren: Story = {
  name: '하위 폴더 2개',
  args: {
    parentDepth: 0,
    subFolders: [makeFolder('a', '일본'), makeFolder('b', '제주도')],
  },
};

export const Loading: Story = {
  name: '로딩 중',
  args: {
    parentDepth: 0,
    subFolders: [],
    isLoading: true,
  },
};

export const MaxDepthReached: Story = {
  name: 'depth 4 (생성 불가, 빈 상태이므로 렌더 X)',
  args: {
    parentDepth: 4,
    subFolders: [],
  },
};

export const MaxDepthWithChildren: Story = {
  name: 'depth 4지만 하위가 이미 있는 경우 — 버튼만 비활성',
  args: {
    parentDepth: 4,
    subFolders: [makeFolder('a', '레거시 폴더')],
  },
};
