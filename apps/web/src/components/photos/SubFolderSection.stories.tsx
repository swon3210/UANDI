import type { Meta, StoryObj } from '@storybook/react';
import type { Folder } from '@/types';
import { SubFolderSection } from './SubFolderSection';

const ts = (ms: number) => ({
  toDate: () => new Date(ms),
  toMillis: () => ms,
  seconds: Math.floor(ms / 1000),
  nanoseconds: 0,
});

function makeFolder(id: string, name: string, createdAtMs = Date.now()): Folder {
  return {
    id,
    coupleId: 'c',
    name,
    createdBy: 'u',
    createdAt: ts(createdAtMs),
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
          '폴더 상세 페이지 상단의 하위 폴더 섹션. 검색/정렬 툴바와 하위 폴더 카드 그리드를 포함한다. "새 하위 폴더" 버튼은 페이지 헤더로 분리되어 이 컴포넌트에 포함되지 않는다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubFolderSection>;

export const TwoChildren: Story = {
  name: '하위 폴더 2개',
  args: {
    subFolders: [makeFolder('a', '일본', 1700000000000), makeFolder('b', '제주도', 1710000000000)],
  },
};

export const ManyChildren: Story = {
  name: '검색/정렬 가능한 다수의 하위 폴더',
  args: {
    subFolders: [
      makeFolder('a', '일본', 1700000000000),
      makeFolder('b', '제주도', 1710000000000),
      makeFolder('c', '오사카', 1720000000000),
      makeFolder('d', '교토', 1730000000000),
      makeFolder('e', '부산', 1740000000000),
    ],
  },
};

export const Loading: Story = {
  name: '로딩 중',
  args: {
    subFolders: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  name: '하위 폴더 없음 (섹션 미렌더)',
  args: {
    subFolders: [],
  },
};
