import type { Meta, StoryObj } from '@storybook/react';
import { PostAuthor } from './PostAuthor';

const meta: Meta<typeof PostAuthor> = {
  title: 'Community/PostAuthor',
  component: PostAuthor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '커뮤니티 글 카드 상단의 작성자 표시. 아바타 + displayName + 상대 시각(시각 라벨은 caller가 dayjs.fromNow로 포맷해 전달).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PostAuthor>;

export const Default: Story = {
  args: {
    displayName: '민지',
    photoURL: 'https://i.pravatar.cc/64?img=47',
    timeLabel: '30분 전',
  },
};

export const NoPhoto: Story = {
  name: '사진 없음 — 이니셜 fallback',
  args: {
    displayName: '서연',
    photoURL: null,
    timeLabel: '2시간 전',
  },
};

export const LongName: Story = {
  name: '긴 이름',
  args: {
    displayName: '아주아주긴닉네임을가진사용자입니다',
    photoURL: null,
    timeLabel: '1일 전',
  },
};
