import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ExampleTagInput, ExampleChipList, EXAMPLES_MAX } from './ExampleTagInput';

const meta: Meta<typeof ExampleTagInput> = {
  title: 'Cashbook/ExampleTagInput',
  component: ExampleTagInput,
};

export default meta;
type Story = StoryObj<typeof ExampleTagInput>;

function Demo({ initial = [] as string[] }) {
  const [items, setItems] = useState<string[]>(initial);
  return (
    <div className="flex w-80 flex-col gap-2">
      <ExampleChipList value={items} onRemove={(v) => setItems(items.filter((x) => x !== v))} />
      <ExampleTagInput
        value={items}
        onAdd={(v) => setItems([...items, v])}
        onRemoveLast={() => setItems(items.slice(0, -1))}
      />
      <p className="text-xs text-muted-foreground">
        {items.length}/{EXAMPLES_MAX}개 — Enter로 추가, Backspace로 마지막 항목 삭제
      </p>
    </div>
  );
}

export const Empty: Story = {
  render: () => <Demo />,
};

export const WithItems: Story = {
  render: () => <Demo initial={['장보기', '외식', '배달', '카페']} />,
};

export const ReachedMax: Story = {
  render: () => <Demo initial={['1', '2', '3', '4', '5', '6', '7', '8']} />,
};
