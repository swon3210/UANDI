import type { Meta, StoryObj } from '@storybook/react';
import dayjs from 'dayjs';
import { WeekSelector } from './WeekSelector';

const meta: Meta<typeof WeekSelector> = {
  title: 'Cashbook/WeekSelector',
  component: WeekSelector,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof WeekSelector>;

const march3rdWeek = {
  week: 3,
  start: dayjs('2026-03-16'),
  end: dayjs('2026-03-22'),
  days: 7,
};

export const Default: Story = {
  args: {
    month: 3,
    weekInfo: march3rdWeek,
    onPrev: () => {},
    onNext: () => {},
  },
};

export const NextDisabled: Story = {
  args: {
    month: 3,
    weekInfo: march3rdWeek,
    onPrev: () => {},
    onNext: () => {},
    isNextDisabled: true,
  },
};

export const ShortWeek: Story = {
  args: {
    month: 3,
    weekInfo: {
      week: 1,
      start: dayjs('2026-03-01'),
      end: dayjs('2026-03-01'),
      days: 1,
    },
    onPrev: () => {},
    onNext: () => {},
  },
};
