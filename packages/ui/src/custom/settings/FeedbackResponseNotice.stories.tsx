import type { Meta, StoryObj } from '@storybook/react';
import { FeedbackResponseNotice } from './FeedbackResponseNotice';

const meta: Meta<typeof FeedbackResponseNotice> = {
  title: 'Settings/FeedbackResponseNotice',
  component: FeedbackResponseNotice,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '의견 보내기 폼 아래 안내. 답장·처리는 대체로 주말에 한다는 것을 보내기 전에 알린다. 이모티콘은 apps/web/public/brand/emoticons 의 "생각중".',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FeedbackResponseNotice>;

export const Default: Story = {};

/** 모바일 최소 폭(320px)에서 줄바꿈·이미지 비율 확인 */
export const NarrowViewport: Story = {
  decorators: [
    (Story) => (
      <div className="w-[320px] bg-background">
        <Story />
      </div>
    ),
  ],
};

/** 이미지 경로가 잘못됐을 때 — 텍스트만으로도 의미가 전달되는지 */
export const BrokenImage: Story = {
  args: { imageSrc: '/brand/emoticons/not-found.png' },
};
