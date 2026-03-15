import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { IconPicker } from './IconPicker';

const meta: Meta<typeof IconPicker> = {
  title: 'Cashbook/IconPicker',
  component: IconPicker,
};

export default meta;
type Story = StoryObj<typeof IconPicker>;

function IconPickerWithState({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <IconPicker value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: () => <IconPickerWithState />,
};

export const WithSelection: Story = {
  render: () => <IconPickerWithState initialValue="💰" />,
};
