import type { Meta, StoryObj } from '@storybook/react';
import { EntryButtons } from './EntryButtons';

const meta: Meta<typeof EntryButtons> = {
  title: 'Dashboard/EntryButtons',
  component: EntryButtons,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof EntryButtons>;

export const Default: Story = {};
