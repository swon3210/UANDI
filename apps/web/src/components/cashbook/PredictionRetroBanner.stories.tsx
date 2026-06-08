import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PredictionRetroBanner, type RetroItemView } from './PredictionRetroBanner';

const meta: Meta<typeof PredictionRetroBanner> = {
  title: 'Cashbook/Cashflow/PredictionRetroBanner',
  component: PredictionRetroBanner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PredictionRetroBanner>;

const noop = () => {};

export const Single: Story = {
  args: {
    items: [
      { id: '1', type: 'expense', amount: 700000, category: '월세', date: new Date(2026, 4, 25) },
    ],
    onConfirm: noop,
    onReject: noop,
    onDismiss: noop,
  },
};

export const Multiple: Story = {
  args: {
    items: [
      { id: '1', type: 'expense', amount: 700000, category: '월세', date: new Date(2026, 4, 25) },
      { id: '2', type: 'expense', amount: 89000, category: '보험', date: new Date(2026, 4, 26) },
      { id: '3', type: 'income', amount: 2000000, category: '상여', date: new Date(2026, 4, 27) },
    ],
    onConfirm: noop,
    onReject: noop,
    onDismiss: noop,
  },
};

function InteractiveDemo() {
  const [items, setItems] = useState<RetroItemView[]>([
    { id: '1', type: 'expense', amount: 700000, category: '월세', date: new Date(2026, 4, 25) },
    { id: '2', type: 'expense', amount: 89000, category: '보험', date: new Date(2026, 4, 26) },
  ]);
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  return (
    <PredictionRetroBanner
      items={items}
      onConfirm={(i) => remove(i.id)}
      onReject={(i) => remove(i.id)}
      onDismiss={() => setItems([])}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
