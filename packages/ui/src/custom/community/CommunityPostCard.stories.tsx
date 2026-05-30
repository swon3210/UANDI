import type { Meta, StoryObj } from '@storybook/react';
import { CommunityPostCard } from './CommunityPostCard';

const meta: Meta<typeof CommunityPostCard> = {
  title: 'Community/CommunityPostCard',
  component: CommunityPostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'type 필드로 user/scraped를 분기해 UserPostCard / LinkPostCard를 렌더. 피드에서 직접 사용하는 진입점.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md space-y-4 bg-background p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CommunityPostCard>;

export const UserVariant: Story = {
  name: 'user 글',
  args: {
    type: 'user',
    author: {
      displayName: '민지',
      photoURL: 'https://i.pravatar.cc/64?img=47',
      timeLabel: '30분 전',
    },
    body: '오늘 신랑이 처음으로 설거지를 했어요 🥹',
  },
};

export const ScrapedVariant: Story = {
  name: 'scraped 글',
  args: {
    type: 'scraped',
    title: '신혼 첫 명절 살아남기',
    body: '명절 스트레스 줄이는 작은 팁들.',
    siteName: '결혼 매거진',
    ogImageUrl: 'https://picsum.photos/seed/uandi-mixed/600/400',
    url: 'https://example.com/newlywed-chuseok',
    timeLabel: '2시간 전',
  },
};
