import type { Meta, StoryObj } from '@storybook/react';
import { AiSpendingAnalysis } from './AiSpendingAnalysis';
import type { AnalyzeSpendingParams } from '@/services/ai';

const mockParams: AnalyzeSpendingParams = {
  entries: [
    { type: 'expense', amount: 50000, category: '식비', date: '2026-04-01', description: '외식' },
    { type: 'expense', amount: 15000, category: '교통', date: '2026-04-02', description: '택시' },
    { type: 'income', amount: 3000000, category: '정기급여', date: '2026-04-01', description: '월급' },
  ],
  year: 2026,
  month: 4,
};

const mockAnalyzeFn = async (
  _params: AnalyzeSpendingParams,
  onChunk: (text: string) => void
) => {
  const text = '## 이번 달 지출 분석\n\n- **식비**가 전체 지출의 77%를 차지하고 있어요.\n- 교통비는 적절한 수준이에요.\n\n### 절약 팁\n- 주 2회 이상 외식을 줄이면 월 5만원 정도 절약할 수 있어요.';
  const words = text.split('');
  for (const w of words) {
    await new Promise((r) => setTimeout(r, 20));
    onChunk(w);
  }
};

const mockAnalyzeFnError = async () => {
  await new Promise((r) => setTimeout(r, 300));
  throw new Error('AI 서비스에 일시적인 문제가 발생했습니다');
};

const meta: Meta<typeof AiSpendingAnalysis> = {
  title: 'Cashbook/AiSpendingAnalysis',
  component: AiSpendingAnalysis,
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiSpendingAnalysis>;

export const Idle: Story = {
  args: {
    params: mockParams,
    analyzeFn: mockAnalyzeFn,
  },
};

export const Error: Story = {
  args: {
    params: mockParams,
    analyzeFn: mockAnalyzeFnError,
  },
};
