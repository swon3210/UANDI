import type { Meta, StoryObj } from '@storybook/react';
import { AiReportCard } from './AiReportCard';

const REPORT = `## 📊 이번 달 요약
이번 달 **여행**에 3,533,000원이 4건 썼어요.

## 📈 평소와 비교
평소(최근 중위값 92,000원)보다 훨씬 많이 썼어요. 제주 여행 항공권과 숙소가 한 달에 몰렸어요.

## 🔍 눈에 띄는 내역
- 10/12 제주 항공권 1,200,000원
- 10/13 숙소 3박 1,500,000원

## 💡 제안
다음 여행은 두 달 전부터 **여행 적립** 항목으로 나눠 모아두면 좋겠어요!`;

const meta: Meta<typeof AiReportCard> = {
  title: 'Cashbook/AiReportCard',
  component: AiReportCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: { onRetry: () => {}, content: '', status: 'loading' },
};
export default meta;

type Story = StoryObj<typeof AiReportCard>;

export const Loading: Story = {};

export const Streaming: Story = {
  args: { content: REPORT.slice(0, 90), status: 'streaming' },
};

export const Success: Story = {
  args: { content: REPORT, status: 'success' },
};

export const Failed: Story = {
  args: { status: 'error', errorMessage: '일일 사용 한도를 초과했습니다' },
};

/** 본문 일부를 받은 뒤 끊긴 경우: 받은 만큼 보여주고 재시도 */
export const FailedAfterPartial: Story = {
  args: { content: REPORT.slice(0, 120), status: 'error' },
};
