import type { Meta, StoryObj } from '@storybook/react';
import { AiReportCard } from './AiReportCard';

const REPORT = `## 📊 요약
여행(▲333만원) 영향으로 평소보다 총 304만원 늘었어요. 여행·데이트는 늘고 식비는 줄었어요.
- 여행: 제주 항공권·숙소가 몰렸어요
- 식비: 여행지 외식이 여행비로 빠졌어요
- 데이트: 이번 달 새로 생겼어요

## 📈 비교
지난 반년 동안 여행비가 한 달에 이만큼 몰린 적은 없었어요. 항공권과 숙소를 같은 달에 결제한 영향이 커요.

## 🧩 카테고리별로 보면
**여행**이 크게 늘어난 반면 **식비**는 평소보다 40만원 줄었어요. 여행지에서 외식을 여행비로 기록하면서 식비가 자연스럽게 빠진 영향도 있어요.

## 🔍 눈에 띄는 내역
- 10/12 제주 항공권 1,200,000원
- 10/13 숙소 3박 1,500,000원

## 💡 제안
다음 여행은 두 달 전부터 **여행 적립** 항목으로 나눠 모아두면 한 달에 몰리지 않아요!`;

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
