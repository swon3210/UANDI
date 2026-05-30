import type { Meta, StoryObj } from '@storybook/react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/button';
import { LinkPostCard } from './LinkPostCard';

const meta: Meta<typeof LinkPostCard> = {
  title: 'Community/LinkPostCard',
  component: LinkPostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '스크래핑된 외부 글의 메타데이터 카드. 저작권 가드레일: 제목 + 짧은 발췌 + OG 썸네일(원본 URL 참조) + 원문 링크아웃만. 원문 본문/이미지 복제·프레이밍 금지.',
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
type Story = StoryObj<typeof LinkPostCard>;

export const Default: Story = {
  args: {
    title: '신혼 첫 명절, 시댁에서 살아남는 법',
    body: '명절 스트레스는 누구나 겪는 일. 신혼부부가 시댁에서 슬기롭게 보내는 작은 팁들...',
    siteName: '결혼 매거진',
    ogImageUrl: 'https://picsum.photos/seed/uandi-chuseok/600/400',
    url: 'https://example.com/newlywed-chuseok',
    timeLabel: '2시간 전',
  },
};

export const NoOgImage: Story = {
  name: 'OG 이미지 없음',
  args: {
    title: '신혼 첫 1년에 자주 싸우는 이유',
    body: '결혼 1년차 부부 100쌍 대상 설문 결과...',
    siteName: '브런치',
    ogImageUrl: null,
    url: 'https://example.com/first-year-fights',
    timeLabel: '어제',
  },
};

export const LongTitle: Story = {
  name: '긴 제목',
  args: {
    title:
      '결혼식 끝나고 처음으로 둘이서 집에 들어와 마주했을 때 어색했던 순간들 모음 — 신혼부부들의 진솔한 후기 30선',
    body: '신혼부부들이 공통적으로 겪는 어색한 순간들.',
    siteName: '결혼 매거진',
    ogImageUrl: 'https://picsum.photos/seed/uandi-newhome/600/400',
    url: 'https://example.com/awkward-moments',
    timeLabel: '3일 전',
  },
};

export const WithAction: Story = {
  name: '액션 슬롯 (신고 메뉴)',
  args: {
    title: '신혼부부가 첫 가전을 살 때 자주 하는 실수',
    body: '냉장고, 세탁기, TV... 어떤 순서로 사야 할까?',
    siteName: '오늘의집',
    ogImageUrl: 'https://picsum.photos/seed/uandi-appliance/600/400',
    url: 'https://example.com/first-appliances',
    timeLabel: '1시간 전',
    actionSlot: (
      <Button variant="ghost" size="icon" aria-label="액션 메뉴" className="h-8 w-8">
        <MoreHorizontal size={18} />
      </Button>
    ),
  },
};
