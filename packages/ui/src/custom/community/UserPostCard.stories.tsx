import type { Meta, StoryObj } from '@storybook/react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/button';
import { UserPostCard } from './UserPostCard';

const author = {
  displayName: '민지',
  photoURL: 'https://i.pravatar.cc/64?img=47',
  timeLabel: '30분 전',
};

const meta: Meta<typeof UserPostCard> = {
  title: 'Community/UserPostCard',
  component: UserPostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '유저가 직접 쓴 글 카드. 작성자 + 본문 + 선택 이미지(1장). actionSlot으로 [⋯] 메뉴를 주입(Phase 3/4).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md bg-background p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserPostCard>;

export const Default: Story = {
  args: {
    author,
    body: '오늘 신랑이 처음으로 설거지를 했어요 🥹\n어찌나 어색해 보이던지...',
  },
};

export const WithImage: Story = {
  name: '이미지 첨부',
  args: {
    author,
    body: '오늘 만든 우리집 떡볶이 🍜',
    imageUrl: 'https://picsum.photos/seed/uandi-food/600/400',
  },
};

export const LongBody: Story = {
  name: '긴 본문',
  args: {
    author,
    body:
      '신혼 첫 명절은 정말 정신 없었어요. '.repeat(8).trim() +
      '\n\n그래도 둘이 같이 보내니까 좋더라구요.',
  },
};

export const WithAction: Story = {
  name: '액션 슬롯 (본인 글 / 메뉴)',
  args: {
    author,
    body: '본인 글이라 메뉴에 삭제 옵션이 노출되는 케이스 미리보기.',
    actionSlot: (
      <Button variant="ghost" size="icon" aria-label="액션 메뉴" className="h-8 w-8">
        <MoreHorizontal size={18} />
      </Button>
    ),
  },
};
