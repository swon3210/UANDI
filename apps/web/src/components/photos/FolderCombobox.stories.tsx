import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { FolderCombobox } from './FolderCombobox';
import type { Folder } from '@/types';

function makeFolder(id: string, name: string): Folder {
  return { id, coupleId: 'c1', name, createdBy: 'u1', createdAt: Timestamp.now() };
}

const fewFolders: Folder[] = [
  makeFolder('f1', '제주도 여행'),
  makeFolder('f2', '일상'),
  makeFolder('f3', '결혼식'),
];

const manyFolders: Folder[] = [
  '2026 결혼기념일 홍콩',
  '2026년 꽃놀이',
  '2025 제주도',
  '2025 부산 여행',
  '일상',
  '결혼식 본식',
  '결혼식 스냅',
  '신혼여행',
  '친구 모임',
  '가족 여행',
  '반려묘',
  '맛집 기록',
  '카페 투어',
  '계절 사진',
].map((name, i) => makeFolder(`f${i + 1}`, name));

type StoryArgs = React.ComponentProps<typeof FolderCombobox>;

function Wrapper(props: Omit<StoryArgs, 'value' | 'onChange'> & { initialValue?: string }) {
  const { initialValue = '', ...rest } = props;
  const [value, setValue] = useState(initialValue);
  return (
    <div className="w-[360px] p-6">
      <FolderCombobox {...rest} value={value} onChange={setValue} />
    </div>
  );
}

const meta: Meta<typeof Wrapper> = {
  title: 'Photos/FolderCombobox',
  component: Wrapper,
};
export default meta;

type Story = StoryObj<typeof Wrapper>;

export const 기본: Story = {
  args: {
    folders: fewFolders,
  },
};

export const 선택된_상태: Story = {
  args: {
    folders: fewFolders,
    initialValue: 'f1',
  },
};

export const 폴더가_많을_때: Story = {
  args: {
    folders: manyFolders,
    onCreateFolder: async (name) => {
      await new Promise((r) => setTimeout(r, 300));
      return `new-${name}`;
    },
  },
};

export const 폴더가_없을_때: Story = {
  args: {
    folders: [],
    onCreateFolder: async (name) => {
      await new Promise((r) => setTimeout(r, 300));
      return `new-${name}`;
    },
  },
};

export const 신규_생성_미지원: Story = {
  args: {
    folders: fewFolders,
  },
};

export const 비활성화: Story = {
  args: {
    folders: fewFolders,
    disabled: true,
  },
};
