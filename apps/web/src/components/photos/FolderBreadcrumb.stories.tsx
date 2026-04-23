import type { Meta, StoryObj } from '@storybook/react';
import type { Folder } from '@/types';
import { FolderBreadcrumb } from './FolderBreadcrumb';

const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 };

function makeFolder(overrides: Partial<Folder>): Folder {
  return {
    id: 'f',
    coupleId: 'c',
    name: 'name',
    createdBy: 'u',
    createdAt: ts,
    parentFolderId: null,
    depth: 0,
    path: [],
    ...overrides,
  } as Folder;
}

const meta: Meta<typeof FolderBreadcrumb> = {
  title: 'Photos/FolderBreadcrumb',
  component: FolderBreadcrumb,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '폴더 상세 페이지 상단에 현재 위치를 표시하는 Breadcrumb. 루트(사진)와 조상은 링크, 현재 폴더는 비링크.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FolderBreadcrumb>;

export const RootChild: Story = {
  name: '루트 바로 아래',
  args: {
    ancestors: [],
    current: makeFolder({ id: 'a', name: '여행' }),
  },
};

export const ThreeLevels: Story = {
  name: '3단계 (여행 / 일본 / 도쿄)',
  args: {
    ancestors: [
      makeFolder({ id: 'a', name: '여행', depth: 0, path: [] }),
      makeFolder({ id: 'b', name: '일본', depth: 1, path: ['a'], parentFolderId: 'a' }),
    ],
    current: makeFolder({
      id: 'c',
      name: '도쿄',
      depth: 2,
      path: ['a', 'b'],
      parentFolderId: 'b',
    }),
  },
};

export const FiveLevelsLong: Story = {
  name: '5단계 + 긴 이름',
  args: {
    ancestors: [
      makeFolder({ id: '1', name: '2024년 우리 부부 사진' }),
      makeFolder({ id: '2', name: '여름 여행', depth: 1, path: ['1'] }),
      makeFolder({ id: '3', name: '제주도', depth: 2, path: ['1', '2'] }),
      makeFolder({ id: '4', name: '협재 해수욕장', depth: 3, path: ['1', '2', '3'] }),
    ],
    current: makeFolder({
      id: '5',
      name: '8월 1일 일출 컷',
      depth: 4,
      path: ['1', '2', '3', '4'],
    }),
  },
};
