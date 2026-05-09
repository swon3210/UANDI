import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MonthlyGrid } from './MonthlyGrid';

const meta: Meta<typeof MonthlyGrid> = {
  title: 'Cashbook/PlanWizard/MonthlyGrid',
  component: MonthlyGrid,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MonthlyGrid>;

function GridDemo({
  initial,
  highlightChanged,
  baseline,
}: {
  initial: number[];
  highlightChanged?: boolean;
  baseline?: number[];
}) {
  const [values, setValues] = useState(initial);
  return (
    <MonthlyGrid
      values={values}
      onChange={setValues}
      highlightChanged={highlightChanged}
      baseline={baseline}
    />
  );
}

export const AllZero: Story = {
  render: () => <GridDemo initial={Array(12).fill(0)} />,
};

export const FilledEvenly: Story = {
  render: () => <GridDemo initial={Array(12).fill(500_000)} />,
};

export const Mixed: Story = {
  render: () => (
    <GridDemo
      initial={[
        1_000_000, 0, 0, 0, 1_500_000, 0, 0, 0, 0, 0, 2_000_000, 0,
      ]}
    />
  ),
};

export const HighlightChanged: Story = {
  render: () => (
    <GridDemo
      initial={[
        500_000, 500_000, 700_000, 500_000, 500_000, 500_000,
        500_000, 500_000, 500_000, 1_200_000, 500_000, 500_000,
      ]}
      highlightChanged
      baseline={Array(12).fill(500_000)}
    />
  ),
};

export const Disabled: Story = {
  args: {
    values: Array(12).fill(800_000),
    onChange: () => {},
    disabled: true,
  },
};
