import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PlanWizardIntro, type WizardModeCounts } from './PlanWizardIntro';
import type { WizardMode } from '@/constants/plan-wizard';

const meta: Meta<typeof PlanWizardIntro> = {
  title: 'Cashbook/PlanWizard/Intro',
  component: PlanWizardIntro,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PlanWizardIntro>;

/** 기본 카테고리 26개 기준: 빠른 모드 14개(정기 수입 2 + 고정 5 + 공통 변동 7) */
const defaultCounts: WizardModeCounts = {
  quick: { income: 2, expense: 12 },
  full: { income: 5, expense: 21 },
};

function Demo({
  counts,
  initialMode = 'quick',
}: {
  counts: WizardModeCounts;
  initialMode?: WizardMode;
}) {
  const [mode, setMode] = useState<WizardMode>(initialMode);
  return <PlanWizardIntro year={2026} counts={counts} mode={mode} onModeChange={setMode} />;
}

export const QuickSelected: Story = {
  name: '빠른 모드 선택(기본)',
  render: () => <Demo counts={defaultCounts} />,
};

export const FullSelected: Story = {
  name: '전체 모드 선택',
  render: () => <Demo counts={defaultCounts} initialMode="full" />,
};

export const Empty: Story = {
  name: '카테고리 없음',
  render: () => (
    <Demo counts={{ quick: { income: 0, expense: 0 }, full: { income: 0, expense: 0 } }} />
  ),
};
