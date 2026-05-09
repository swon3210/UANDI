import type { Meta, StoryObj } from '@storybook/react';
import { PlanWizardShell } from './PlanWizardShell';

const meta: Meta<typeof PlanWizardShell> = {
  title: 'Cashbook/PlanWizard/Shell',
  component: PlanWizardShell,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof PlanWizardShell>;

export const Intro: Story = {
  args: {
    title: '연간 예산 위저드',
    subtitle: '시작하기',
    progress: 0,
    onNext: () => {},
    onExit: () => {},
    prevDisabled: true,
    children: (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
        본문 영역
      </div>
    ),
  },
};

export const Mid: Story = {
  args: {
    title: '정기급여',
    subtitle: '수입 · 1 / 8',
    progress: 0.4,
    onPrev: () => {},
    onNext: () => {},
    onExit: () => {},
    children: (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
        본문 영역
      </div>
    ),
  },
};

export const NextDisabled: Story = {
  args: {
    title: '검증',
    subtitle: '수입과 지출 합계 비교',
    progress: 0.85,
    onPrev: () => {},
    onNext: () => {},
    onExit: () => {},
    nextDisabled: true,
    children: (
      <div className="rounded-xl border border-coral-200 bg-coral-50 p-6 text-center text-sm text-coral-600">
        부족 1,200,000원
      </div>
    ),
  },
};

export const Summary: Story = {
  args: {
    title: '완료',
    progress: 1,
    onPrev: () => {},
    onNext: () => {},
    onExit: () => {},
    nextLabel: '메인으로',
    children: (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
        요약
      </div>
    ),
  },
};
