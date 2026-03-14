import type { Meta, StoryObj } from '@storybook/react';
import { SelectionModeBar } from './SelectionModeBar';

const meta: Meta<typeof SelectionModeBar> = {
  title: 'Photos/SelectionModeBar',
  component: SelectionModeBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '선택 모드 헤더. 선택 수 표시 + 닫기/이동 버튼.',
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
type Story = StoryObj<typeof SelectionModeBar>;

export const NoSelection: Story = {
  name: '0장 선택 (이동 비활성)',
  args: { selectedCount: 0, onClose: () => {}, onMove: () => {} },
};

export const SomeSelected: Story = {
  name: '3장 선택',
  args: { selectedCount: 3, onClose: () => {}, onMove: () => {} },
};

export const ManySelected: Story = {
  name: '15장 선택',
  args: { selectedCount: 15, onClose: () => {}, onMove: () => {} },
};
