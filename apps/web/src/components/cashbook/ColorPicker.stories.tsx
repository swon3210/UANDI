import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Cashbook/ColorPicker',
  component: ColorPicker,
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

function ColorPickerWithState({ initialValue = '#E8837A' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <ColorPicker value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: () => <ColorPickerWithState />,
};

export const WithSelection: Story = {
  render: () => <ColorPickerWithState initialValue="#4CAF86" />,
};
