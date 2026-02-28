import type { Meta, StoryObj } from '@storybook/react';
import { ArrowLeft, Plus, MoreVertical } from 'lucide-react';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Custom/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '모든 페이지 상단에 사용하는 헤더 컴포넌트. leftSlot / rightSlot으로 아이콘 버튼을 주입합니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: '가계부',
  },
};

export const WithBackButton: Story = {
  name: '뒤로가기 버튼',
  args: {
    title: '사진 상세',
    leftSlot: (
      <button className="flex items-center justify-center text-foreground">
        <ArrowLeft size={20} />
      </button>
    ),
  },
};

export const WithActionButton: Story = {
  name: '우측 액션 버튼',
  args: {
    title: '사진',
    rightSlot: (
      <button className="flex items-center justify-center text-foreground">
        <Plus size={20} />
      </button>
    ),
  },
};

export const WithBothSlots: Story = {
  name: '양쪽 슬롯 모두',
  args: {
    title: '사진 상세',
    leftSlot: (
      <button className="flex items-center justify-center text-foreground">
        <ArrowLeft size={20} />
      </button>
    ),
    rightSlot: (
      <button className="flex items-center justify-center text-foreground">
        <MoreVertical size={20} />
      </button>
    ),
  },
};
