import type { Meta, StoryObj } from '@storybook/react';
import { CompareAiSummary } from './CompareAiSummary';

const SUMMARY = `제주 여행이 한 달에 몰리면서 **여행**이 이번 달 변화를 거의 다 만들었고, 대신 **식비**는 평소보다 줄었어요. 다음 여행은 미리 나눠 모아두면 한 달에 몰리지 않아요.`;

const meta: Meta<typeof CompareAiSummary> = {
  title: 'Dashboard/CompareAiSummary',
  component: CompareAiSummary,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    scopeTitle: '선택한 카테고리 3개',
    content: SUMMARY,
    status: 'success',
    onRetry: () => {},
    href: '#',
  },
};
export default meta;

type Story = StoryObj<typeof CompareAiSummary>;

export const Success: Story = {};

/** 카테고리를 고르지 않아 범위 전체를 요약 */
export const WholeScope: Story = {
  args: { scopeTitle: '전체 변동 지출' },
};

/** 요청 직후 첫 청크 전 (필터를 바꾼 뒤 1초 대기 중에도 이 상태) */
export const Loading: Story = {
  args: { content: '', status: 'loading' },
};

/** 요약 섹션이 들어오는 중 */
export const Streaming: Story = {
  args: { content: SUMMARY.slice(0, 40), status: 'streaming' },
};

/** 일일 한도 초과 등 실패 */
export const Failed: Story = {
  args: { content: '', status: 'error', errorMessage: '일일 사용 한도를 초과했습니다' },
};

export const LongScopeTitle: Story = {
  args: { scopeTitle: '아주아주긴카테고리이름입니다정말로길어요' },
};
