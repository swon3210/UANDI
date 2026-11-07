import type { Meta, StoryObj } from '@storybook/react';
import { AnnualPlanPromptCard } from './AnnualPlanPromptCard';

const meta: Meta<typeof AnnualPlanPromptCard> = {
  title: 'Dashboard/AnnualPlanPromptCard',
  component: AnnualPlanPromptCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '올해 예산 권유 카드. 플랜이 없으면 "세우기", 위저드를 중간에 나갔으면(리비전 0개) "이어서 세우기"로 보인다. 위저드로 강제 이동하던 동작을 대체한다. 닫으면 30일 뒤 다시 보이고, 위저드를 완료하면 사라진다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    year: 2026,
    href: '/inner/cashbook/plan/annual/wizard?step=intro',
    onDismiss: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AnnualPlanPromptCard>;

export const Start: Story = { name: '플랜 없음 — 세우기' };

export const Resume: Story = {
  name: '미완 — 이어서 세우기 (3개 입력)',
  args: {
    variant: 'resume',
    progress: { done: 3, total: 14 },
    href: '/inner/cashbook/plan/annual/wizard?step=income&catIdx=1&phase=avg&mode=quick',
  },
};

export const ResumeNothingEntered: Story = {
  name: '미완 — 시작만 해 둠',
  args: {
    variant: 'resume',
    progress: { done: 0, total: 14 },
  },
};

/** 경제 목표 페이지 상단 배너 — 닫기 없음 */
export const ResumeBannerWithoutDismiss: Story = {
  name: '미완 — 경제 목표 페이지 배너(닫기 없음)',
  args: {
    variant: 'resume',
    progress: { done: 1, total: 14 },
    onDismiss: undefined,
  },
};
