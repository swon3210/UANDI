import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CategorySelector, type CategoryOption } from './CategorySelector';

const meta: Meta<typeof CategorySelector> = {
  title: 'Dashboard/CategorySelector',
  component: CategorySelector,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CategorySelector>;

const options = (): CategoryOption[] => [
  { name: '식비', color: '#E8837A' },
  { name: '교통', color: '#F9B2AC' },
  { name: '쇼핑', color: '#BE4B44' },
  { name: '월세', color: '#D8635A' },
  { name: '여가', color: '#98D9BF' },
  { name: '의료', color: '#4CAF86' },
  { name: '문화', color: '#368869' },
];

function Interactive({
  initial,
  max = 5,
}: {
  initial: string[];
  max?: number;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  return (
    <CategorySelector
      options={options()}
      selected={selected}
      max={max}
      onToggle={(name) =>
        setSelected((prev) =>
          prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        )
      }
    />
  );
}

export const Default: Story = {
  render: () => <Interactive initial={['식비', '교통', '쇼핑']} />,
};

export const Empty: Story = {
  render: () => <Interactive initial={[]} />,
};

export const ReachedMax: Story = {
  render: () => (
    <Interactive initial={['식비', '교통', '쇼핑', '월세', '여가']} max={5} />
  ),
};
