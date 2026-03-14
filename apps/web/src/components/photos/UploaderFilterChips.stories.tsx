import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UploaderFilterChips, type UploaderFilter } from './UploaderFilterChips';

const meta: Meta<typeof UploaderFilterChips> = {
  title: 'Photos/UploaderFilterChips',
  component: UploaderFilterChips,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '업로더 기준 필터 칩 (전체 / 나 / 연인). 폴더·태그 상세에서 사용.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '448px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UploaderFilterChips>;

function InteractiveWrapper() {
  const [filter, setFilter] = useState<UploaderFilter>('all');
  return <UploaderFilterChips value={filter} onChange={setFilter} />;
}

export const Default: Story = {
  name: '기본 (인터랙티브)',
  render: () => <InteractiveWrapper />,
};

export const AllSelected: Story = {
  name: '전체 선택됨',
  args: { value: 'all', onChange: () => {} },
};

export const MeSelected: Story = {
  name: '나 선택됨',
  args: { value: 'me', onChange: () => {} },
};

export const PartnerSelected: Story = {
  name: '연인 선택됨',
  args: { value: 'partner', onChange: () => {} },
};
