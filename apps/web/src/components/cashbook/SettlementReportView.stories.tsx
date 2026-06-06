import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { SettlementReportView } from './SettlementReportView';
import type { SettlementReportSnapshot } from '@/types';

const dailyData = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return { day, cumulative: Math.round((day / 30) * 1_840_000) };
});

const fullReport: SettlementReportSnapshot = {
  totals: { income: 3_200_000, expense: 1_840_000, flex: 420_000 },
  spending: 2_260_000,
  budgetCeiling: 2_000_000,
  spentPct: 113,
  barData: [
    { category: '식비', budget: 600_000, actual: 540_000 },
    { category: '교통', budget: 150_000, actual: 130_000 },
    { category: '여가(FLEX)', budget: 300_000, actual: 420_000 },
    { category: '월세', budget: 800_000, actual: 800_000 },
  ],
  pieData: [
    { name: '수입', value: 3_200_000 },
    { name: '지출', value: 1_840_000 },
    { name: 'FLEX', value: 420_000 },
  ],
  dailyData,
  aiAnalysis:
    '## 이번 달 요약\n\n총 지출은 예산을 **13% 초과**했어요. 특히 FLEX 항목(여가)에서 예산보다 12만원 더 썼습니다.\n\n- 식비는 예산 내에서 잘 관리됐어요 👍\n- 다음 달에는 FLEX 지출에 조금 더 주의해 보세요.',
  entryCount: 42,
  completedAt: Timestamp.fromDate(new Date('2026-07-01T09:30:00')),
};

const meta: Meta<typeof SettlementReportView> = {
  title: 'Cashbook/SettlementReportView',
  component: SettlementReportView,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettlementReportView>;

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementReportView report={fullReport} monthLabel="2026-06" onRedo={() => {}} />
    </div>
  ),
};

// AI 분석 없이 완료한 경우
export const NoAiAnalysis: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementReportView
        report={{ ...fullReport, aiAnalysis: '' }}
        monthLabel="2026-06"
        onRedo={() => {}}
      />
    </div>
  ),
};

// 예산 정보가 없는 경우 (barData 비어있음)
export const NoBudget: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementReportView
        report={{ ...fullReport, barData: [], budgetCeiling: 0, spentPct: null }}
        monthLabel="2026-06"
        onRedo={() => {}}
      />
    </div>
  ),
};

export const Redoing: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementReportView
        report={fullReport}
        monthLabel="2026-06"
        onRedo={() => {}}
        isRedoing
      />
    </div>
  ),
};
