import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AnalyzeSpendingPreferences } from './AnalyzeSpendingPreferences';
import { DEFAULT_ANALYZE_SPENDING, type AnalyzeSpendingPrefs } from './aiPreferences';

const meta: Meta<typeof AnalyzeSpendingPreferences> = {
  title: 'Settings/AI 맞춤화/A. 지출 분석',
  component: AnalyzeSpendingPreferences,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '지출 분석(월 점검 보고서) 맞춤화 섹션. 말투/관점/분량 knob 전용 — 자유 텍스트가 없어 ' +
          '프롬프트 인젝션 표면이 없다. 실제 프롬프트 문장은 서버가 소유한다.',
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
};

export default meta;
type Story = StoryObj<typeof AnalyzeSpendingPreferences>;

function Demo({ initial }: { initial: AnalyzeSpendingPrefs }) {
  const [value, setValue] = useState(initial);
  return <AnalyzeSpendingPreferences value={value} onChange={setValue} />;
}

export const Default: Story = {
  name: '기본 (꺼짐)',
  render: () => <Demo initial={DEFAULT_ANALYZE_SPENDING} />,
};

export const Enabled: Story = {
  name: '켜짐 (기본 선택)',
  render: () => <Demo initial={{ ...DEFAULT_ANALYZE_SPENDING, enabled: true }} />,
};

export const StrictSavingDetailed: Story = {
  name: '엄격·절약·자세히',
  render: () => (
    <Demo initial={{ enabled: true, tone: 'strict', focus: 'saving', length: 'detailed' }} />
  ),
};
